/* Vercel Function: серверная часть проекта.
   Vercel автоматически поднимает каждую функцию из папки api/ как эндпоинт:
   этот файл будет доступен по адресу https://<проект>.vercel.app/api/health.
   Локально при vite dev он не используется — только на Vercel. */

export default function handler(_req: Request) {
  return Response.json({
    status: "ok",
    service: "PtoPRO-ERP API",
    version: "0.1.0",
    time: new Date().toISOString(),
  });
}
