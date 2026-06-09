export default function handler(req, res) {
    res.status(200).json({
        has_url: !!process.env.SUPABASE_URL,
        has_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        node_version: process.version,
        env: process.env.NODE_ENV
    });
}
