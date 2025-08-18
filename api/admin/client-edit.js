/**
 * ✏️ EDITAR CLIENTE - FORMULARIO DE EDICIÓN
 * 
 * Página para editar los detalles de un cliente específico
 * URL: /admin/client-edit?id={clientId}
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        return await handleGetEdit(req, res);
    } else if (req.method === 'POST') {
        return await handlePostEdit(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
};

async function handleGetEdit(req, res) {
    try {
        // Obtener ID del cliente desde query params
        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        // Obtener datos del cliente
        const response = await supabase
            .from('tenants')
            .select(`
                id,
                name,
                email,
                phone,
                address,
                active,
                slot_config
            `)
            .eq('id', clientId)
            .single();

        if (response.error) {
            throw new Error(response.error.message);
        }

        if (!response.data) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const client = response.data;

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✏️ Editar Cliente: ${client.name} - WhatsApp Bot</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .back-btn {
            margin-bottom: 20px;
        }
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.3s ease;
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a67d8;
        }
        .form-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
            border-left: 5px solid #667eea;
        }
        .form-section h3 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            border-color: #667eea;
            outline: none;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin: 0;
        }
        .info-box {
            background: #e8f4fd;
            border: 1px solid #b8daff;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .info-box h4 {
            color: #0066cc;
            margin-bottom: 8px;
        }
        .info-box p {
            color: #004085;
            margin: 0;
            font-size: 0.9rem;
        }
        .submit-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
        }
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 20px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✏️ Editar Cliente</h1>
            <p>Modificar datos de <strong>${client.name}</strong></p>
        </div>
        
        <div class="content">
            <div class="back-btn">
                <a href="/admin/client-view?id=${client.id}" class="btn btn-secondary">← Volver a Detalles</a>
            </div>

            <form method="POST" action="/admin/client-edit?id=${client.id}">
                <!-- Información Básica -->
                <div class="form-section">
                    <h3>📋 Información Básica</h3>
                    
                    <div class="form-group">
                        <label for="name">Nombre del Negocio *</label>
                        <input type="text" id="name" name="name" value="${client.name}" required>
                    </div>

                    <div class="grid-2">
                        <div class="form-group">
                            <label for="email">Email de Contacto</label>
                            <input type="email" id="email" name="email" value="${client.email || ''}">
                        </div>
                        <div class="form-group">
                            <label for="phone">Número WhatsApp *</label>
                            <input type="tel" id="phone" name="phone" value="${client.phone}" required placeholder="14155238886">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="address">Dirección del Negocio</label>
                        <textarea id="address" name="address" rows="3" placeholder="Calle Principal 123, Ciudad, Código Postal">${client.address || ''}</textarea>
                    </div>
                </div>

                <!-- Configuración -->
                <div class="form-section">
                    <h3>⚙️ Configuración del Sistema</h3>
                    
                    <div class="info-box">
                        <h4>🔧 Configuración de Slots</h4>
                        <p>Configura cómo se manejarán las reservas y horarios disponibles para este cliente.</p>
                    </div>

                    <div class="grid-2">
                        <div class="form-group">
                            <label for="slot_granularity">Duración de Slots (minutos)</label>
                            <select id="slot_granularity" name="slot_granularity">
                                <option value="15" ${(client.slot_config?.slot_granularity || 15) === 15 ? 'selected' : ''}>15 minutos</option>
                                <option value="30" ${(client.slot_config?.slot_granularity || 15) === 30 ? 'selected' : ''}>30 minutos</option>
                                <option value="60" ${(client.slot_config?.slot_granularity || 15) === 60 ? 'selected' : ''}>60 minutos</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="max_advance_booking_days">Días máximo para reservar</label>
                            <input type="number" id="max_advance_booking_days" name="max_advance_booking_days" 
                                   value="${client.slot_config?.max_advance_booking_days || 30}" min="1" max="365">
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="allow_same_day_booking" name="allow_same_day_booking" 
                                   ${client.slot_config?.allow_same_day_booking !== false ? 'checked' : ''}>
                            <label for="allow_same_day_booking">Permitir reservas el mismo día</label>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="active" name="active" ${client.active ? 'checked' : ''}>
                            <label for="active">Cliente activo (puede recibir mensajes)</label>
                        </div>
                    </div>
                </div>

                <!-- Botón de Envío -->
                <div class="submit-section">
                    <button type="submit" class="btn btn-primary" style="font-size: 1.2rem; padding: 15px 40px;">
                        💾 Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error('Error loading client edit:', error);
        return res.status(500).json({
            error: 'Failed to load client edit form',
            message: error.message
        });
    }
}

async function handlePostEdit(req, res) {
    try {
        // Obtener ID del cliente desde query params
        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        // Parse form data
        let body = '';
        if (req.body) {
            body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        } else {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            body = Buffer.concat(chunks).toString();
        }

        const formData = new URLSearchParams(body);
        
        // Extract form data
        const updateData = {
            name: formData.get('name'),
            email: formData.get('email') || null,
            phone: formData.get('phone'),
            address: formData.get('address') || null,
            active: formData.has('active'),
            slot_config: {
                slot_granularity: parseInt(formData.get('slot_granularity')) || 15,
                max_advance_booking_days: parseInt(formData.get('max_advance_booking_days')) || 30,
                allow_same_day_booking: formData.has('allow_same_day_booking')
            },
            updated_at: new Date().toISOString()
        };

        // Update client
        const { error } = await supabase
            .from('tenants')
            .update(updateData)
            .eq('id', clientId);

        if (error) {
            throw new Error(error.message);
        }

        // Redirect to client view with success message
        const successHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✅ Cliente Actualizado</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
        }
        .success-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
        }
        .success-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .success-title {
            color: #28a745;
            font-size: 2rem;
            margin-bottom: 15px;
        }
        .success-message {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.3s ease;
            margin: 0 10px;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a67d8;
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
    </style>
    <script>
        // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = '/admin/client-view?id=${clientId}';
        }, 3000);
    </script>
</head>
<body>
    <div class="success-container">
        <div class="success-icon">✅</div>
        <h1 class="success-title">¡Cliente Actualizado!</h1>
        <p class="success-message">
            Los datos del cliente <strong>${updateData.name}</strong> han sido actualizados correctamente.
            <br><br>
            Serás redirigido automáticamente en 3 segundos...
        </p>
        <div>
            <a href="/admin/client-view?id=${clientId}" class="btn btn-primary">Ver Cliente</a>
            <a href="/admin/manage-clients" class="btn btn-secondary">Lista de Clientes</a>
        </div>
    </div>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(successHtml);

    } catch (error) {
        console.error('Error updating client:', error);
        return res.status(500).json({
            error: 'Failed to update client',
            message: error.message
        });
    }
}
