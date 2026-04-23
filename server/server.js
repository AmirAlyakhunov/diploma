import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import supabase from './supabaseClient.js'

const upload = multer({ storage: multer.memoryStorage() })

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000'

const app = express()
const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))
app.use(express.json())

// 1. Получение списка приложений (с обязательным фильтром по платформе)
app.get('/apps', async (req, res) => {
    const { platform } = req.query; // Ожидаем ?platform=web или ios или android

    let query = supabase
        .from('apps')
        .select(`
            id,
            name,
            description,
            logo_url,
            screenshots ( image_url ),
            app_platforms!inner ( platforms!inner ( slug ) ),
            app_categories ( categories ( slug, label ) )
        `)
        .order('created_at', { ascending: false });

    // Если платформа передана (а фронт ее будет передавать), фильтруем
    if (platform) {
        query = query.eq('app_platforms.platforms.slug', platform);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. Детальная информация об одном приложении (для страницы приложения)
app.get('/apps/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('apps')
        .select(`
            id,
            name,
            description,
            logo_url,
            website_url,
            app_platforms ( platforms ( slug, label ) ),
            app_categories ( categories ( slug, label ) ),
            screenshots (
                id,
                image_url,
                sort_order,
                screenshot_tags ( tags ( slug, label ) )
            )
        `)
        .eq('id', req.params.id)
        .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// 3. Только скриншоты конкретного приложения
app.get('/apps/:id/screenshots', async (req, res) => {
    const { data, error } = await supabase
        .from('screenshots')
        .select(`
            id,
            image_url,
            sort_order,
            uploaded_at,
            screenshot_tags ( tags ( slug, label ) )
        `)
        .eq('app_id', req.params.id)
        .order('sort_order', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// 4. Справочник платформ
app.get('/platforms', async (req, res) => {
    const { data, error } = await supabase
        .from('platforms')
        .select('*')

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// 5. Справочник категорий
app.get('/categories', async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// 6. Поиск по изображению (CLIP)
app.post('/search/image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Image is required' })
    }

    try {
        console.log('Processing image search...')
        
        // 1. Получаем эмбеддинг изображения от AI-сервиса
        const formData = new FormData()
        formData.append('image', new Blob([req.file.buffer]), req.file.originalname)
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/embed/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        const embedding = aiResponse.data.embedding
        console.log('Image embedding received, length:', embedding?.length)
        
        // 2. Ищем похожие скриншоты через косинусное сходство
        const { data, error } = await supabase.rpc('cosine_similarity_search', {
            query_embedding: embedding,
            match_count: 20
        })
        
        console.log('Search results:', data?.length || 0)

        if (error) return res.status(500).json({ error: error.message })

        // 3. Получаем данные скриншотов
        if (!data || data.length === 0) {
            return res.json([])
        }

        const screenshotIds = data.map(item => item.screenshot_id)

        const { data: screenshots, error: screenshotsError } = await supabase
            .from('screenshots')
            .select(`
                id,
                image_url,
                app_id,
                apps ( id, name, logo_url )
            `)
            .in('id', screenshotIds)

        if (screenshotsError) return res.status(500).json({ error: screenshotsError.message })

        // 4. Сортируем в порядке сходства
        const sortedScreenshots = screenshotIds.map(id => 
            screenshots.find(s => s.id === id)
        ).filter(Boolean)

        // 5. Добавляем similarity score
        const result = sortedScreenshots.map((screenshot, index) => ({
            ...screenshot,
            similarity: data.find(d => d.screenshot_id === screenshot.id)?.similarity || 0
        }))

        res.json(result)

    } catch (err) {
        console.error('Image search error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

// 7. Поиск по текстовому описанию (CLIP)
app.post('/search/text', async (req, res) => {
    const { query, limit = 20 } = req.body

    if (!query) {
        return res.status(400).json({ error: 'Query is required' })
    }

    try {
        console.log('Search query:', query)
        
        // 1. Получаем эмбеддинг текста от AI-сервиса
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/embed/text`, {
            text: query
        })
        const embedding = aiResponse.data.embedding
        console.log('Embedding received, length:', embedding?.length)
        
        // 2. Ищем похожие скриншоты через косинусное сходство
        const { data, error } = await supabase.rpc('cosine_similarity_search', {
            query_embedding: embedding,
            match_count: limit
        })
        
        console.log('Search results:', data?.length || 0)

        if (error) return res.status(500).json({ error: error.message })

        // 3. Получаем данные скриншотов
        if (!data || data.length === 0) {
            return res.json([])
        }

        const screenshotIds = data.map(item => item.screenshot_id)

        const { data: screenshots, error: screenshotsError } = await supabase
            .from('screenshots')
            .select(`
                id,
                image_url,
                app_id,
                apps ( id, name, logo_url )
            `)
            .in('id', screenshotIds)

        if (screenshotsError) return res.status(500).json({ error: screenshotsError.message })

        // 4. Сортируем в порядке сходства
        const sortedScreenshots = screenshotIds.map(id => 
            screenshots.find(s => s.id === id)
        ).filter(Boolean)

        // 5. Добавляем similarity score
        const result = sortedScreenshots.map((screenshot, index) => ({
            ...screenshot,
            similarity: data.find(d => d.screenshot_id === screenshot.id)?.similarity || 0
        }))

        res.json(result)

    } catch (err) {
        console.error('Search error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})