// product.service.js - API client service
const API_BASE = '/api/products';

export async function getAllProducts() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (error) {
    console.error('getAllProducts error:', error);
    return [];
  }
}

export async function getPublishedProducts() {
  try {
    const res = await fetch(`${API_BASE}?type=published`);
    if (!res.ok) throw new Error('Failed to fetch published products');
    const data = await res.json();
    console.log('[ProductService] getPublishedProducts result:', data);
    return data;
  } catch (error) {
    console.error('getPublishedProducts error:', error);
    return [];
  }
}

export async function getProductById(id) {
  try {
    const res = await fetch(`${API_BASE}?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return await res.json();
  } catch (error) {
    console.error('getProductById error:', error);
    return null;
  }
}

// New function to get product including deleted ones (for existing user access)
export async function getProductByIdIncludeDeleted(id) {
  try {
    const res = await fetch(`${API_BASE}?id=${id}&includeDeleted=true`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return await res.json();
  } catch (error) {
    console.error('getProductByIdIncludeDeleted error:', error);
    return null;
  }
}


export async function addProduct(product) {
  try {
    // Force is_published to 1 (true)
    const productData = { ...product, is_published: 1 };
    
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add product');
    }
    return await res.json();
  } catch (error) {
    console.error('addProduct error:', error);
    throw error;
  }
}

export async function updateProduct(product) {
  try {
    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update product');
    }
    return await res.json();
  } catch (error) {
    console.error('updateProduct error:', error);
    throw error;
  }
}

export async function deleteProduct(id) {
  try {
    const res = await fetch(API_BASE, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    return true;
  } catch (error) {
    console.error('deleteProduct error:', error);
    throw error;
  }
}
