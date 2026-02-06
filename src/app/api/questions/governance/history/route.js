import { NextResponse } from 'next/server';
import { getGovernanceHistory } from '@/lib/server-db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const versionId = searchParams.get('versionId');
        const conceptId = searchParams.get('conceptId');

        if (!versionId && !conceptId) {
            return NextResponse.json({ error: 'versionId or conceptId is required' }, { status: 400 });
        }

        const history = getGovernanceHistory(versionId, conceptId);
        return NextResponse.json(history);
    } catch (error) {
        console.error('Governance History API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
