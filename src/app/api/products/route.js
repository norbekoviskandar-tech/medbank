import { NextResponse } from 'next/server';
import * as db from '@/lib/db/index';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    
    console.log(`[API Products] GET type=${type}, includeDeleted=${includeDeleted}`);
    const id = searchParams.get('id');
    
    if (id) {
      const product = includeDeleted ? db.getProductByIdIncludeDeleted(id) : db.getProductById(id);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json(product);
    }
    
    let products;
    if (type === 'published') {
      products = db.getPublishedProducts();
    } else {
      products = db.getAllProducts();
    }
    
    console.log(`[API Products] Found ${products?.length} products`);
    return NextResponse.json(products);
  } catch (error) {
    console.error('[API Products] GET error:', error);
    // Try to get path from the module if possible
    return NextResponse.json({ 
      error: 'Failed to fetch products', 
      details: error.message,
      stack: error.stack,
      dbPath: db.DB_PATH
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[API Products] POST body:', body);
    const product = db.createProduct(body);
    return NextResponse.json(product);
  } catch (error) {
    console.error('[API Products] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('[API Products] PUT body:', body);
    const product = db.updateProduct(body);
    return NextResponse.json(product);
  } catch (error) {
    console.error('[API Products] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    console.log('[API Products] DELETE id:', id);
    const success = db.deleteProduct(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[API Products] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
