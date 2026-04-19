import 'dotenv/config'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getAllScreenshots() {
    let allScreenshots = []
    let page = 0
    const pageSize = 100
    
    while (true) {
        const { data, error } = await supabase
            .from('screenshots')
            .select('id, image_url')
            .range(page * pageSize, (page + 1) * pageSize - 1)
        
        if (error) {
            console.error('Error fetching screenshots:', error)
            break
        }
        
        if (!data || data.length === 0) break
        
        allScreenshots = allScreenshots.concat(data)
        console.log(`Fetched ${allScreenshots.length} screenshots...`)
        
        if (data.length < pageSize) break
        page++
    }
    
    return allScreenshots
}

async function getEmbedding(imageUrl) {
    try {
        // Скачиваем изображение
        const imageResponse = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 
        })
        
        // Отправляем в AI-сервис
        const formData = new FormData()
        const blob = new Blob([imageResponse.data], { type: 'image/jpeg' })
        formData.append('image', blob, 'screenshot.jpg')
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/embed/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
        })
        
        return aiResponse.data.embedding
    } catch (err) {
        console.error('Error getting embedding:', err.message)
        return null
    }
}

async function indexScreenshots() {
    console.log('Starting screenshot indexing...')
    
    // Получаем все скриншоты
    const screenshots = await getAllScreenshots()
    console.log(`Total screenshots to index: ${screenshots.length}`)
    
    // Проверяем, какие уже проиндексированы
    const { data: existing } = await supabase
        .from('screenshot_embeddings')
        .select('screenshot_id')
    
    const indexedIds = new Set(existing.map(e => e.screenshot_id))
    const toIndex = screenshots.filter(s => !indexedIds.has(s.id))
    
    console.log(`Screenshots to index: ${toIndex.length}`)
    
    // Индексируем
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < toIndex.length; i++) {
        const screenshot = toIndex[i]
        console.log(`[${i + 1}/${toIndex.length}] Indexing ${screenshot.id}...`)
        
        const embedding = await getEmbedding(screenshot.image_url)
        
        if (embedding) {
            const { error } = await supabase
                .from('screenshot_embeddings')
                .insert({
                    screenshot_id: screenshot.id,
                    visual_embedding: embedding,
                    indexed_at: new Date().toISOString()
                })
            
            if (error) {
                console.error('Insert error:', error.message)
                failCount++
            } else {
                successCount++
            }
        } else {
            failCount++
        }
        
        // Пауза между запросами, чтобы не перегрузить AI-сервис
        await new Promise(r => setTimeout(r, 500))
    }
    
    console.log(`\nDone! Success: ${successCount}, Failed: ${failCount}`)
}

indexScreenshots()