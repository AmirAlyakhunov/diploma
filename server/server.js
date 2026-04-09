import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import supabase from './supabaseClient.js'

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
            app_platforms!inner ( platforms!inner ( slug ) )
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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})