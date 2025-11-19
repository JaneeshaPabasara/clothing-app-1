import React, { useState, useEffect, useRef } from 'react';
import Landing from './Landing page Artisons.jpg';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Wedding',
    images: []
  });
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'products'));
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Loaded products:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error loading products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...images] 
      }));
    });
  };

  const addProduct = async () => {
    if (!formData.name || !formData.price) {
      alert('Please fill in Product Name and Price');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        category: formData.category,
        images: formData.images || []
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        alert('Product updated successfully!');
        setEditingProduct(null);
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        console.log('Product added with ID:', docRef.id);
        alert('Product added successfully!');
      }
      
      setFormData({
        name: '',
        price: '',
        description: '',
        category: 'Wedding',
        images: [],
      });
      
      await loadProducts();
      setCurrentPage('view');
    } catch (error) {
      console.error('Error adding/updating product:', error);
      alert('Error saving product: ' + error.message);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        await loadProducts();
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
      }
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      images: product.images || []
    });
    setCurrentPage('add');
  };

  const CategoryCard = ({ title, count, image, category }) => (
    <div
      onClick={() => {
        setSelectedCategory(category);
        setCurrentPage('listing');
      }}
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '250px',
        transition: 'transform 0.3s',
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <img
        src={image}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}>
        <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '16px' }}>{count} listings</p>
      </div>
    </div>
  );

  const ProductCard = ({ product, showActions = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', height: '250px', backgroundColor: '#e5e7eb' }}>
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev > 0 ? prev - 1 : product.images.length - 1
                      );
                    }}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      padding: '8px 12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev < product.images.length - 1 ? prev + 1 : 0
                      );
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      padding: '8px 12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                    }}
                  >
                    ›
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}>
              No Image
            </div>
          )}
        </div>
        <div
          style={{ padding: '16px', cursor: showActions ? 'default' : 'pointer' }}
          onClick={() => {
            if (!showActions) {
              setSelectedProduct(product);
              setCurrentPage('detail');
            }
          }}
        >
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            ${product.price}
          </h3>
          <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
            {product.name}
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            {product.description}
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>Category: {product.category}</p>
          {showActions && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => startEdit(product)}
                style={{
                  flex: 1,
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                ✎ Edit
              </button>
              <button
                onClick={() => deleteProduct(product.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const HomePage = () => {
    const weddingCount = products.filter((p) => p.category === 'Wedding').length;
    const uniformCount = products.filter((p) => p.category === 'Uniform').length;
    const moreCount = products.filter((p) => p.category === 'More').length;

    if (loading) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '24px', color: '#7c3aed' }}>Loading...</div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <header style={{
          position: 'relative',
          padding: '60px 20px',
          minHeight: '500px',
          overflow: 'hidden',
          backgroundColor: '#e9d5ff',
        }}>
          {Landing && (
            <>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${Landing})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.3,
                zIndex: 1
              }}></div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(233, 213, 255, 0.85), rgba(216, 180, 254, 0.75))',
                zIndex: 2
              }}></div>
            </>
          )}
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            position: 'relative',
            zIndex: 3
          }}>
            <div style={{ maxWidth: '600px' }}>
              <h1 style={{
                fontSize: '52px',
                fontWeight: 'bold',
                color: '#581c87',
                marginBottom: '16px',
                fontFamily: 'Georgia, serif',
                lineHeight: '1.2',
              }}>
                Tailored Perfection for Every Style
              </h1>
              <p style={{ 
                color: '#6b21a8', 
                marginBottom: '32px', 
                fontSize: '18px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic'
              }}>
                From Fabric to Fashion – Designed by Artisans
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage('listing');
                }}
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                View More
              </button>
            </div>
          </div>
        </header>

        <section style={{ padding: '80px 20px', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '16px',
              fontFamily: 'Georgia, serif',
            }}>
              Artisans
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px',
              fontSize: '18px',
              lineHeight: '1.6',
            }}>
              We create handmade, modern clothing tailored to your unique style.
              Whether it's casual, formal, or something special, we bring your
              ideas to life—made just the way you want.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}>
              <CategoryCard
                title="Wedding"
                count={weddingCount}
                category="Wedding"
                image="https://images.unsplash.com/photo-1519741497674-611481863552?w=400"
              />
              <CategoryCard
                title="Uniform"
                count={uniformCount}
                category="Uniform"
                image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400"
              />
              <CategoryCard
                title="More"
                count={moreCount}
                category="More"
                image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
              />
            </div>
          </div>
        </section>

        <section style={{ padding: '80px 20px', backgroundColor: '#f9fafb' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '60px',
              fontFamily: 'Georgia, serif',
            }}>
              Inventory
            </h2>
            <div style={{
              backgroundColor: '#e9d5ff',
              borderRadius: '16px',
              padding: '40px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px',
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>Add New Product</h3>
                <button
                  onClick={() => setCurrentPage('add')}
                  style={{
                    backgroundColor: 'white',
                    color: '#7c3aed',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                  }}
                >
                  Add +
                </button>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>View All Products</h3>
                <button
                  onClick={() => setCurrentPage('view')}
                  style={{
                    backgroundColor: 'white',
                    color: '#7c3aed',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                  }}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer style={{ backgroundColor: '#3b0764', color: 'white', padding: '60px 20px' }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
          }}>
            <div>
              <h3 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                marginBottom: '16px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}>
                Artisans
              </h3>
              <p style={{ fontSize: '14px', color: '#e9d5ff' }}>
                Where your style meets our craftsmanship.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#e9d5ff', fontSize: '14px' }}>
                <li style={{ marginBottom: '8px', cursor: 'pointer' }}>Home</li>
                <li style={{ marginBottom: '8px', cursor: 'pointer' }}>Browse Categories</li>
                <li style={{ marginBottom: '8px', cursor: 'pointer' }}>Featured Listings</li>
                <li style={{ marginBottom: '8px', cursor: 'pointer' }}>My Account</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Categories</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#e9d5ff', fontSize: '14px' }}>
                <li style={{ marginBottom: '8px', cursor: 'pointer' }}>Wedding</li>
                <li style={{ marginBottom: '8px', cursor: 'pointer' }}>Uniform</li>
                <li style={{ marginBottom: '8px', cursor: 'pointer' }}>More</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Contact Us</h4>
              <input
                type="email"
                placeholder="Email"
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  color: '#000',
                }}
              />
              <textarea
                placeholder="Message..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: 'none',
                  color: '#000',
                  minHeight: '80px',
                }}
              ></textarea>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '14px', color: '#e9d5ff' }}>
            © 2025 artisons. All rights reserved.
          </div>
        </footer>
      </div>
    );
  };

  const ListingPage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => setCurrentPage('home')}
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            border: '2px solid #000',
            borderRadius: '50%',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ←
        </button>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Search for anything..."
            value={searchTerm}
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchTerm(newValue);
            }}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
          <button style={{
            backgroundColor: '#7c3aed',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
          }}>
            🔍
          </button>
        </div>

        <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '32px' }}>
          {selectedCategory === 'all' ? 'All Products' : selectedCategory}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
            fontSize: '18px',
          }}>
            No products found
          </div>
        )}
      </div>
    </div>
  );

  const AddProductPage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <button
          onClick={() => {
            setCurrentPage('home');
            setEditingProduct(null);
            setFormData({
              name: '',
              price: '',
              description: '',
              category: 'Wedding',
              images: [],
            });
          }}
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            border: '2px solid #000',
            borderRadius: '50%',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ←
        </button>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '40px',
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '32px',
            fontFamily: 'Georgia, serif',
          }}>
            {editingProduct ? 'Edit Product' : 'Add new product'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Product Name
              </label>
              <input
                type="text"
                placeholder="Enter product name"
                defaultValue={formData.name}
                onBlur={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                }}
                onKeyUp={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Product Price
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter product price"
                defaultValue={formData.price}
                onBlur={(e) => {
                  setFormData(prev => ({ ...prev, price: e.target.value }));
                }}
                onKeyUp={(e) => {
                  setFormData(prev => ({ ...prev, price: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Product Description
              </label>
              <textarea
                placeholder="Enter product description"
                defaultValue={formData.description}
                onBlur={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                }}
                onKeyUp={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  minHeight: '120px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Product Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData(prev => ({ ...prev, category: newValue }));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              >
                <option>Wedding</option>
                <option>Uniform</option>
                <option>More</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Attach Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              />
              {formData.images.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}>
                  {formData.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img
                        src={img}
                        alt={`Preview ${idx}`}
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                      <button
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== idx);
                          setFormData({ ...formData, images: newImages });
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          lineHeight: '1',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={addProduct}
              style={{
                width: '100%',
                backgroundColor: '#7c3aed',
                color: 'white',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
              }}
            >
              {editingProduct ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ViewAllPage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => setCurrentPage('home')}
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            border: '2px solid #000',
            borderRadius: '50%',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ←
        </button>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '40px',
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '32px',
            fontFamily: 'Georgia, serif',
          }}>
            All Products
          </h2>

          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search by Anything ...."
              value={searchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchTerm(newValue);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  border: '2px solid #7c3aed',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {product.name}
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '4px' }}>
                      Price - ${product.price}
                    </p>
                    <p style={{ color: '#6b7280', marginBottom: '4px' }}>
                      Category - {product.category}
                    </p>
                    <p style={{ color: '#6b7280' }}>{product.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => startEdit(product)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280',
              fontSize: '18px',
            }}>
              No products found
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ProductDetailPage = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!selectedProduct) return null;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => setCurrentPage('listing')}
            style={{
              marginBottom: '20px',
              padding: '10px 16px',
              border: '2px solid #000',
              borderRadius: '50%',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ←
          </button>

          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            {selectedProduct.category} &gt; {selectedProduct.name}
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'relative', height: '500px', backgroundColor: '#e5e7eb' }}>
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <>
                  <img
                    src={selectedProduct.images[currentImageIndex]}
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {selectedProduct.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev > 0 ? prev - 1 : selectedProduct.images.length - 1
                          )
                        }
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: '50%',
                          padding: '12px 16px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '24px',
                        }}
                      >
                        ‹
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev < selectedProduct.images.length - 1 ? prev + 1 : 0
                          )
                        }
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: '50%',
                          padding: '12px 16px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '24px',
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '18px',
                }}>
                  No Image
                </div>
              )}
            </div>

            <div style={{ padding: '40px' }}>
              <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '8px' }}>
                $ {selectedProduct.price}
              </h1>
              <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '32px' }}>
                {selectedProduct.name}
              </h2>

              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                  Description
                </h3>
                <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6' }}>
                  {selectedProduct.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <nav style={{
        backgroundColor: '#e9d5ff',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1
            onClick={() => setCurrentPage('home')}
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#581c87',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            Artisans
          </h1>
          <div style={{ display: 'flex', gap: '24px', color: '#4b5563', fontSize: '16px' }}>
            <button style={{
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              fontSize: '16px',
            }}>
              About
            </button>
            <button style={{
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              fontSize: '16px',
            }}>
              Contact
            </button>
            <button style={{
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              fontSize: '16px',
            }}>
              Help
            </button>
            <span style={{ color: '#9ca3af' }}>|</span>
            <button style={{
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              fontSize: '16px',
            }}>
              Login
            </button>
          </div>
        </div>
      </nav>

      {currentPage === 'home' && <HomePage />}
      {currentPage === 'listing' && <ListingPage />}
      {currentPage === 'add' && <AddProductPage />}
      {currentPage === 'view' && <ViewAllPage />}
      {currentPage === 'detail' && <ProductDetailPage />}
    </div>
  );
};

export default App;