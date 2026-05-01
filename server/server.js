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
    const { platform, limit = 20, offset = 0, category } = req.query; // Добавлены limit, offset, category

    // Build select statement dynamically based on whether we're filtering by category
    let selectStatement = `
        id,
        name,
        description,
        logo_url,
        screenshots ( image_url ),
        app_platforms!inner ( platforms!inner ( slug ) ),
        app_categories ( categories ( slug, label ) )
    `;
    
    // If filtering by category, we need to use !inner to ensure apps have that category
    if (category) {
        selectStatement = `
            id,
            name,
            description,
            logo_url,
            screenshots ( image_url ),
            app_platforms!inner ( platforms!inner ( slug ) ),
            app_categories!inner ( categories!inner ( slug, label ) )
        `;
    }

    let query = supabase
        .from('apps')
        .select(selectStatement)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1); // Пагинация

    // Если платформа передана (а фронт ее будет передавать), фильтруем
    if (platform) {
        query = query.eq('app_platforms.platforms.slug', platform);
    }

    // Фильтр по категории
    if (category) {
        query = query.eq('app_categories.categories.slug', category);
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
        
        // 2. Ищем похожие скриншоты через гибридный поиск (визуальный + OCR)
        // Если функция hybrid_similarity_search не существует, используем fallback на визуальный поиск
        let data = null
        let error = null
        
        try {
            const result = await supabase.rpc('hybrid_similarity_search', {
                query_embedding: embedding,
                visual_weight: 0.6,
                text_weight: 0.4,
                match_count: 100
            })
            data = result.data
            error = result.error
            console.log('Using hybrid search')
        } catch (err) {
            console.log('Hybrid search function not available, falling back to visual-only search')
            // Fallback to visual-only search
            const result = await supabase.rpc('cosine_similarity_search', {
                query_embedding: embedding,
                match_count: 100
            })
            data = result.data
            error = result.error
        }
        
        console.log('Search results before filtering:', data?.length || 0)

        if (error) return res.status(500).json({ error: error.message })

        // 3. Фильтруем по порогу similarity (0.49)
        const similarity_threshold = 0.49
        const filteredData = data ? data.filter(item => item.similarity >= similarity_threshold) : []
        console.log('Search results after threshold filtering:', filteredData.length)

        // 4. Получаем данные скриншотов
        if (!filteredData || filteredData.length === 0) {
            return res.json([])
        }

        const screenshotIds = filteredData.map(item => item.screenshot_id)

        const { data: screenshots, error: screenshotsError } = await supabase
            .from('screenshots')
            .select(`
                id,
                image_url,
                app_id,
                apps ( id, name, logo_url, description ),
                screenshot_embeddings ( ocr_text )
            `)
            .in('id', screenshotIds)

        if (screenshotsError) return res.status(500).json({ error: screenshotsError.message })

        // 5. Сортируем в порядке сходства
        const sortedScreenshots = screenshotIds.map(id =>
            screenshots.find(s => s.id === id)
        ).filter(Boolean)

        // 6. Добавляем similarity score и OCR текст
        const result = sortedScreenshots.map((screenshot, index) => {
            // Извлекаем OCR текст из screenshot_embeddings (может быть объектом или массивом)
            let ocrText = ''
            if (screenshot.screenshot_embeddings) {
                if (Array.isArray(screenshot.screenshot_embeddings)) {
                    ocrText = screenshot.screenshot_embeddings[0]?.ocr_text || ''
                } else {
                    ocrText = screenshot.screenshot_embeddings?.ocr_text || ''
                }
            }
            
            return {
                ...screenshot,
                similarity: filteredData.find(d => d.screenshot_id === screenshot.id)?.similarity || 0,
                ocr_text: ocrText
            }
        })

        res.json(result)

    } catch (err) {
        console.error('Image search error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

// 7. Поиск по текстовому описанию (CLIP)
app.post('/search/text', async (req, res) => {
    const { query, limit = 20, offset = 0, similarity_threshold = 0.49 } = req.body

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
        
        // 2. Ищем похожие скриншоты через гибридный поиск (визуальный + OCR)
        // Если функция hybrid_similarity_search не существует, используем fallback на визуальный поиск
        let data = null
        let error = null
        
        // Запрашиваем больше результатов, чтобы после фильтрации по порогу осталось достаточно
        const requestedCount = Math.max(100, (limit + offset) * 2);
        
        try {
            const result = await supabase.rpc('hybrid_similarity_search', {
                query_embedding: embedding,
                visual_weight: 0.6,
                text_weight: 0.4,
                match_count: requestedCount
            })
            data = result.data
            error = result.error
            console.log('Using hybrid search for text query')
        } catch (err) {
            console.log('Hybrid search function not available, falling back to visual-only search')
            // Fallback to visual-only search
            const result = await supabase.rpc('cosine_similarity_search', {
                query_embedding: embedding,
                match_count: requestedCount
            })
            data = result.data
            error = result.error
        }
        
        console.log('Search results before filtering:', data?.length || 0)

        if (error) return res.status(500).json({ error: error.message })

        // 3. Фильтруем по порогу similarity
        const filteredData = data ? data.filter(item => item.similarity >= similarity_threshold) : []
        console.log('Search results after threshold filtering:', filteredData.length)

        // 4. Получаем данные скриншотов только для отфильтрованных результатов
        if (!filteredData || filteredData.length === 0) {
            return res.json([])
        }

        // Применяем пагинацию после фильтрации
        const paginatedData = filteredData.slice(offset, offset + limit)
        const screenshotIds = paginatedData.map(item => item.screenshot_id)

        const { data: screenshots, error: screenshotsError } = await supabase
            .from('screenshots')
            .select(`
                id,
                image_url,
                app_id,
                apps ( id, name, logo_url, description ),
                screenshot_embeddings ( ocr_text )
            `)
            .in('id', screenshotIds)

        if (screenshotsError) return res.status(500).json({ error: screenshotsError.message })

        // 5. Сортируем в порядке сходства
        const sortedScreenshots = screenshotIds.map(id =>
            screenshots.find(s => s.id === id)
        ).filter(Boolean)

        // 6. Добавляем similarity score и OCR текст
        const result = sortedScreenshots.map((screenshot, index) => {
            // Извлекаем OCR текст из screenshot_embeddings (может быть объектом или массивом)
            let ocrText = ''
            if (screenshot.screenshot_embeddings) {
                if (Array.isArray(screenshot.screenshot_embeddings)) {
                    ocrText = screenshot.screenshot_embeddings[0]?.ocr_text || ''
                } else {
                    ocrText = screenshot.screenshot_embeddings?.ocr_text || ''
                }
            }
            
            return {
                ...screenshot,
                similarity: paginatedData[index]?.similarity || 0,
                ocr_text: ocrText
            }
        })

        // 7. Возвращаем также общее количество отфильтрованных результатов для пагинации
        res.json({
            results: result,
            total: filteredData.length,
            hasMore: offset + limit < filteredData.length
        })

    } catch (err) {
        console.error('Search error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

// 8. Поиск приложений по тексту
app.get('/search/apps', async (req, res) => {
    const { query, limit = 10 } = req.query

    if (!query) {
        return res.status(400).json({ error: 'Query is required' })
    }

    try {
        console.log('Searching apps for query:', query)
        const { data, error } = await supabase
            .from('apps')
            .select('id, name, description, logo_url')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(limit)

        if (error) {
            console.error('Supabase error:', error)
            return res.status(500).json({ error: error.message })
        }
        console.log('Found apps:', data.length)
        res.json(data)
    } catch (err) {
        console.error('App search error:', err.message)
        res.status(500).json({ error: err.message })
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})