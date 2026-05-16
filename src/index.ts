export default {
	async fetch(request, env, ctx): Promise<Response> {
		// 1. CORS用の共通ヘッダーを定義
		const origin = request.headers.get('Origin') || '*';
		const corsHeaders = {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || 'Content-Type',
			'Access-Control-Max-Age': '86400', // 24時間キャッシュ
		};

		// 2. プリフライト（OPTIONS）リクエストのハンドリング
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		// トンネルはPOSTリクエストのみ受け付け
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', {
				status: 405,
				headers: corsHeaders,
			});
		}

		try {
			const envelopeBytes = await request.arrayBuffer();
			const envelope = new TextDecoder().decode(envelopeBytes);
			const piece = envelope.split('\n')[0];
			const header = JSON.parse(piece);

			if (!header['dsn']) {
				throw new Error('Missing DSN in envelope header');
			}

			const dsn = new URL(header['dsn']);
			const project_id = dsn.pathname?.replace('/', '');

			if (dsn.hostname !== env.SENTRY_HOST) {
				throw new Error(`Invalid sentry hostname: ${dsn.hostname}`);
			}

			const isInteger = /^\d+$/.test(project_id);
			if (!project_id || !isInteger) {
				throw new Error(`Invalid sentry project id: ${project_id}`);
			}

			const upstream_sentry_url = `https://${env.SENTRY_HOST}/api/${project_id}/envelope/`;

			// Sentryへフォワード
			const res = await fetch(upstream_sentry_url, {
				method: 'POST',
				body: envelopeBytes,
			});

			if (res.ok) {
				// 3. 成功レスポンス（CORSヘッダーを付与）
				return new Response('{}', {
					status: 200,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				});
			} else {
				console.error('error tunneling to sentry', res.status);
				console.error(await res.text());

				return new Response(JSON.stringify({ error: 'error tunneling to sentry' }), {
					status: res.status,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				});
			}
		} catch (e) {
			console.error('error tunneling to sentry', e);

			// 4. エラーレスポンス（ここでもCORSヘッダーを付与しないとブラウザ側でエラーが遮蔽されます）
			return new Response(JSON.stringify({ error: 'error tunneling to sentry' }), {
				status: 400,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			});
		}
	},
} satisfies ExportedHandler<Env>;
