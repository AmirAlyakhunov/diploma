import 'dotenv/config'
import supabase from './supabaseClient.js'

async function importScreenshots() {
    try {
        // Получаем название папки из аргумента командной строки
        const folderName = process.argv[2]

        if (!folderName) {
            console.error('❌ Пожалуйста, укажите название папки:')
            console.error('   npm start <название-папки>')
            console.error('\nПример: npm start "MyAppName"')
            return
        }

        console.log(`📁 Обработка папки: ${folderName}\n`)

        const appFolders = [{ name: folderName }]

        for (const folder of appFolders) {
            const appName = folder.name
            console.log(`\nОбрабатываю приложение: ${appName}`)

            // 2. Проверяем — существует ли уже такое приложение в БД
            const { data: existingApp, error: appCheckError } = await supabase
                .from('apps')
                .select('id')
                .eq('name', appName)
                .single()

            let appId

            if (appCheckError && appCheckError.code !== 'PGRST116') {
                console.error(`  Ошибка при проверке приложения: ${appCheckError.message}`)
                continue
            }

            if (existingApp) {
                appId = existingApp.id
                console.log(`  Приложение уже есть в БД, id: ${appId}`)
            } else {
                // 3. Создаём приложение если его ещё нет
                const { data: newApp, error: appError } = await supabase
                    .from('apps')
                    .insert({ name: appName })
                    .select('id')
                    .single()

                if (appError) {
                    console.error(`  Ошибка при создании приложения: ${appError.message}`)
                    continue
                }

                appId = newApp.id
                console.log(`  Создано новое приложение, id: ${appId}`)
            }

            // 4. Получаем список файлов в папке приложения
            const { data: files, error: filesError } = await supabase.storage
                .from('screenshots')
                .list(appName, { limit: 1000 })

            if (filesError) {
                console.error(`  Ошибка при получении файлов: ${filesError.message}`)
                continue
            }

            // Фильтруем только изображения
            const images = files.filter(f =>
                f.name && f.name.match(/\.(png|jpg|jpeg|webp)$/i)
            )

            console.log(`  Найдено скриншотов: ${images.length}`)

            // 5. Для каждого файла получаем публичную ссылку и создаём строку в screenshots
            let sortOrder = 0

            for (const image of images) {
                const filePath = `${appName}/${image.name}`

                // Получаем публичную ссылку
                const { data: publicUrlData } = supabase.storage
                    .from('screenshots')
                    .getPublicUrl(filePath)

                const imageUrl = publicUrlData.publicUrl

                if (!imageUrl) {
                    console.error(`  Не удалось получить URL для ${filePath}`)
                    continue
                }

                // Проверяем — не занесён ли уже этот скриншот
                const { data: existingScreenshot, error: screenshotCheckError } = await supabase
                    .from('screenshots')
                    .select('id')
                    .eq('image_url', imageUrl)
                    .single()

                if (screenshotCheckError && screenshotCheckError.code !== 'PGRST116') {
                    console.error(`  Ошибка при проверке скриншота: ${screenshotCheckError.message}`)
                    continue
                }

                if (existingScreenshot) {
                    console.log(`  Пропускаю (уже есть): ${image.name}`)
                    sortOrder++
                    continue
                }

                // Вставляем скриншот в БД
                const { error: insertError } = await supabase
                    .from('screenshots')
                    .insert({
                        app_id: appId,
                        image_url: imageUrl,
                        sort_order: sortOrder
                    })

                if (insertError) {
                    console.error(`  Ошибка при вставке ${image.name}: ${insertError.message}`)
                } else {
                    console.log(`  Добавлен: ${image.name}`)
                }

                sortOrder++
            }
        }

        console.log('\nГотово!')
    } catch (error) {
        console.error('Неожиданная ошибка:', error)
    }
}

importScreenshots()