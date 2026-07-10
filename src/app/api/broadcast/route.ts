import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { to, templateName, variables = [], language = 'es_AR', imageUrl, buttonUrl } = await req.json();

        if (!to || !templateName) {
            return NextResponse.json({ error: "Faltan parámetros (to, templateName)" }, { status: 400 });
        }

        const NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const JWT_TOKEN = process.env.WHATSAPP_API_TOKEN;
        const VERSION = 'v19.0';

        if (!NUMBER_ID || !JWT_TOKEN) {
             return NextResponse.json({ error: "Faltan credenciales de Meta (WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_API_TOKEN)" }, { status: 500 });
        }

        const url = `https://graph.facebook.com/${VERSION}/${NUMBER_ID}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: language },
                    ...(variables.length > 0 || imageUrl || buttonUrl ? {
                        components: [
                            ...(imageUrl ? [{
                                type: 'header',
                                parameters: [
                                    {
                                        type: 'image',
                                        image: {
                                            link: imageUrl
                                        }
                                    }
                                ]
                            }] : []),
                            ...(variables.length > 0 ? [{
                                type: 'body',
                                parameters: variables.map((v: string) => ({ type: 'text', text: v }))
                            }] : []),
                            ...(buttonUrl ? [{
                                type: 'button',
                                sub_type: 'url',
                                index: '0',
                                parameters: [
                                    {
                                        type: 'text',
                                        text: buttonUrl
                                    }
                                ]
                            }] : [])
                        ]
                    } : {})
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error?.message || "Error desconocido de Meta", full: data }, { status: response.status });
        }

        return NextResponse.json({ success: true, metaResponse: data });
    } catch (e: any) {
        return NextResponse.json({ error: "Error de servidor: " + e.message }, { status: 500 });
    }
}
