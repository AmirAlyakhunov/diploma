import 'dotenv/config'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Название приложения берём из аргумента командной строки
// Пример: node indexScreenshots.js "Intercom Web"
const appNameFilter = process.argv[2] || null

async function getAllScreenshots(appName) {
    let allScreenshots = []
    let page = 0
    const pageSize = 100

    // Если передано название — сначала находим id приложения
    let appId = null
    if (appName) {
        const { data: app, error: appError } = await supabase
            .from('apps')
            .select('id, name')
            .ilike('name', appName) // ilike — поиск без учёта регистра
            .single()

        if (appError || !app) {
            console.error(`Приложение "${appName}" не найдено в БД`)
            process.exit(1)
        }

        appId = app.id
        console.log(`Найдено приложение: ${app.name} (${appId})`)
    }

    while (true) {
        let query = supabase
            .from('screenshots')
            .select('id, image_url')
            .range(page * pageSize, (page + 1) * pageSize - 1)

        // Фильтруем по приложению если указано
        if (appId) {
            query = query.eq('app_id', appId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Ошибка при получении скриншотов:', error)
            break
        }

        if (!data || data.length === 0) break

        allScreenshots = allScreenshots.concat(data)
        console.log(`Загружено скриншотов: ${allScreenshots.length}...`)

        if (data.length < pageSize) break
        page++
    }

    return allScreenshots
}

async function getEmbedding(imageUrl) {
    try {
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        })

        const formData = new FormData()
        const blob = new Blob([imageResponse.data], { type: 'image/jpeg' })
        formData.append('image', blob, 'screenshot.jpg')

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/embed/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
        })

        return aiResponse.data.embedding
    } catch (err) {
        console.error('Ошибка при получении эмбеддинга:', err.message)
        return null
    }
}

async function indexScreenshots() {
    if (appNameFilter) {
        console.log(`Индексирую скриншоты приложения: "${appNameFilter}"`)
    } else {
        console.log('Название приложения не указано — индексирую все скриншоты')
        console.log('Подсказка: node indexScreenshots.js "Название приложения"')
    }

    const screenshots = await getAllScreenshots(appNameFilter)
    console.log(`Всего скриншотов найдено: ${screenshots.length}`)

    if (screenshots.length === 0) {
        console.log('Нет скриншотов для индексации')
        return
    }

    // Проверяем какие уже проиндексированы
    const { data: existing } = await supabase
        .from('screenshot_embeddings')
        .select('screenshot_id')

    const indexedIds = new Set(existing.map(e => e.screenshot_id))
    const toIndex = screenshots.filter(s => !indexedIds.has(s.id))

    console.log(`Уже проиндексировано: ${screenshots.length - toIndex.length}`)
    console.log(`Осталось проиндексировать: ${toIndex.length}`)

    if (toIndex.length === 0) {
        console.log('Все скриншоты уже проиндексированы')
        return
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < toIndex.length; i++) {
        const screenshot = toIndex[i]
        console.log(`[${i + 1}/${toIndex.length}] Индексирую ${screenshot.id}...`)

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
                console.error('Ошибка при вставке:', error.message)
                failCount++
            } else {
                successCount++
            }
        } else {
            failCount++
        }

        await new Promise(r => setTimeout(r, 500))
    }

    console.log(`\nГотово! Успешно: ${successCount}, Ошибок: ${failCount}`)
}

indexScreenshots()