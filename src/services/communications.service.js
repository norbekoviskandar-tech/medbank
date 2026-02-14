// communications.service.js

const mockQA = [
    { id: 'QA-101', student: 'Sarah J.', topic: 'Pharmacology - HTN', message: 'Why is lisinopril preferred over ARBs in this specific case?', status: 'urgent', date: new Date().toISOString() },
    { id: 'QA-102', student: 'Michael R.', topic: 'Anatomy - Neuro', message: 'The crossing of fibers in the medulla is confusing in diagram 4.2.', status: 'new', date: new Date().toISOString() },
    { id: 'QA-103', student: 'Elena T.', topic: 'Biochem - TCA', message: 'Is there a pneumonic for the rate-limiting enzymes?', status: 'answered', date: new Date().toISOString() }
];

export async function getQAItems() {
    return new Promise(resolve => setTimeout(() => resolve(mockQA), 500));
}

export async function sendAnnouncement(title, body, target = 'all') {
    console.log(`[Announcement] ${title}: ${body} (Target: ${target})`);
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
}
