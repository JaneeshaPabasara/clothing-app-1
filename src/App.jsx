import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import './App.css';
import Landing from './assets/Landing.jpg';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

// Memoized Product Card Component
const ProductCard = memo(({ product, showActions = false, onEdit, onDelete, onView }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <div className="product-card">
      <div className="product-image">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[currentImageIndex]}
              alt={product.name}
              loading="lazy"
            />
            {product.images.length > 1 && (
              <>
                <button
                  className="nav-btn left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev > 0 ? prev - 1 : product.images.length - 1
                    );
                  }}
                >
                  ‹
                </button>
                <button
                  className="nav-btn right"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev < product.images.length - 1 ? prev + 1 : 0
                    );
                  }}
                >
                  ›
                </button>
              </>
            )}
          </>
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>
      <div
        className="product-info"
        onClick={() => !showActions && onView(product)}
      >
        <h3 className="product-price">${product.price}</h3>
        <h4 className="product-name">{product.name}</h4>
        <p className="product-description">{product.description}</p>
        <p className="product-category">Category: {product.category}</p>
        {showActions && (
          <div className="product-actions">
            <button onClick={() => onEdit(product)} className="btn-edit">
              ✎ Edit
            </button>
            <button onClick={() => onDelete(product.id)} className="btn-delete">
              🗑 Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

// Memoized Category Card
const CategoryCard = memo(({ title, count, image, category, onClick }) => (
  <div onClick={() => onClick(category)} className="category-card">
    <img src={image} alt={title} loading="lazy" />
    <div className="category-overlay">
      <h3>{title}</h3>
      <p>{count} listings</p>
    </div>
  </div>
));

CategoryCard.displayName = 'CategoryCard';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [images, setImages] = useState([]);

  // Use refs for form inputs to avoid re-render issues
  const nameInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const searchListingRef = useRef(null);
  const searchViewRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'products'));
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error loading products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((newImages) => {
      setImages(prev => [...prev, ...newImages]);
    });
  };

  const addProduct = async () => {
    const name = nameInputRef.current?.value || '';
    const price = priceInputRef.current?.value || '';
    const description = descriptionInputRef.current?.value || '';
    const category = categoryInputRef.current?.value || 'Wedding';

    if (!name || !price) {
      alert('Please fill in Product Name and Price');
      return;
    }

    if (parseFloat(price) <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      const productData = {
        name,
        price,
        description,
        category,
        images: images || []
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        alert('Product updated successfully!');
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, 'products'), productData);
        alert('Product added successfully!');
      }
      
      // Clear form
      if (nameInputRef.current) nameInputRef.current.value = '';
      if (priceInputRef.current) priceInputRef.current.value = '';
      if (descriptionInputRef.current) descriptionInputRef.current.value = '';
      if (categoryInputRef.current) categoryInputRef.current.value = 'Wedding';
      setImages([]);
      
      await loadProducts();
      setCurrentPage('view');
    } catch (error) {
      console.error('Error adding/updating product:', error);
      alert('Error saving product: ' + error.message);
    } finally {
      setSaving(false);
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

  const startEdit = useCallback((product) => {
    setEditingProduct(product);
    setImages(product.images || []);
    setCurrentPage('add');
    
    // Set values with a small delay to ensure refs are ready
    setTimeout(() => {
      if (nameInputRef.current) nameInputRef.current.value = product.name;
      if (priceInputRef.current) priceInputRef.current.value = product.price;
      if (descriptionInputRef.current) descriptionInputRef.current.value = product.description;
      if (categoryInputRef.current) categoryInputRef.current.value = product.category;
    }, 50);
  }, []);

  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentPage('listing');
  }, []);

  const handleViewProduct = useCallback((product) => {
    setSelectedProduct(product);
    setCurrentPage('detail');
  }, []);

  const handleSearchChange = useCallback(() => {
    const searchValue = searchListingRef.current?.value || searchViewRef.current?.value || '';
    setSearchTerm(searchValue);
  }, []);

  const HomePage = () => {
    const weddingCount = products.filter((p) => p.category === 'Wedding').length;
    const uniformCount = products.filter((p) => p.category === 'Uniform').length;
    const moreCount = products.filter((p) => p.category === 'More').length;

    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-text">Loading...</div>
        </div>
      );
    }

    return (
      <div className="home-page">
        <header className="hero-section" style={{ backgroundImage: `url(${Landing})` }}>
          <div className="hero-content">
            <div className="hero-text">
              <h1>Tailored Perfection for Every Style..</h1>
              <p>From Fabric to Fashion – Designed by Artisans</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage('listing');
                }}
                className="btn-primary"
              >
                View More
              </button>
            </div>
          </div>
        </header>

        <section className="about-section">
          <div className="container">
            <h2>Artisans</h2>
            <p className="about-text">
              We create handmade, modern clothing tailored to your unique style.
              Whether it's casual, formal, or something special, we bring your
              ideas to life—made just the way you want.
            </p>

            <div className="category-grid">
              <CategoryCard
                title="Wedding"
                count={weddingCount}
                category="Wedding"
                image="https://images.unsplash.com/photo-1519741497674-611481863552?w=400"
                onClick={handleCategoryClick}
              />
              <CategoryCard
                title="Uniform"
                count={uniformCount}
                category="Uniform"
                image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400"
                onClick={handleCategoryClick}
              />
              <CategoryCard
                title="More"
                count={moreCount}
                category="More"
                image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
                onClick={handleCategoryClick}
              />
            </div>
          </div>
        </section>

        <section className="inventory-section">
          <div className="container">
            <h2>Inventory</h2>
            <div className="inventory-card">
              <div className="inventory-row">
                <h3>Add New Product</h3>
                <button onClick={() => setCurrentPage('add')} className="btn-secondary">
                  Add +
                </button>
              </div>
              <div className="inventory-row">
                <h3>View All Products</h3>
                <button onClick={() => setCurrentPage('view')} className="btn-secondary">
                  View
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-col">
              <h3>Artisans</h3>
              <p>Where your style meets our craftsmanship.</p>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li>Home</li>
                <li>Browse Categories</li>
                <li>Featured Listings</li>
                <li>My Account</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Categories</h4>
              <ul>
                <li>Wedding</li>
                <li>Uniform</li>
                <li>More</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contact Us</h4>
              <input type="email" placeholder="Email" />
              <textarea placeholder="Message..."></textarea>
            </div>
          </div>
          <div className="footer-bottom">
            © 2025 artisons. All rights reserved.
          </div>
        </footer>
      </div>
    );
  };

  const ListingPage = () => (
    <div className="page-container">
      <div className="container">
        <button onClick={() => setCurrentPage('home')} className="back-btn">
          ←
        </button>

        <div className="search-container">
          <input
            ref={searchListingRef}
            type="text"
            placeholder="Search for anything..."
            onInput={handleSearchChange}
            defaultValue={searchTerm}
          />
          <button className="btn-primary">🔍</button>
        </div>

        <h2 className="page-title">
          {selectedCategory === 'all' ? 'All Products' : selectedCategory}
        </h2>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              onView={handleViewProduct}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="no-products">No products found</div>
        )}
      </div>
    </div>
  );

  const AddProductPage = () => (
    <div className="page-container">
      <div className="container-small">
        <button
          onClick={() => {
            setCurrentPage('home');
            setEditingProduct(null);
            setImages([]);
            if (nameInputRef.current) nameInputRef.current.value = '';
            if (priceInputRef.current) priceInputRef.current.value = '';
            if (descriptionInputRef.current) descriptionInputRef.current.value = '';
            if (categoryInputRef.current) categoryInputRef.current.value = 'Wedding';
          }}
          className="back-btn"
        >
          ←
        </button>

        <div className="form-card">
          <h2>{editingProduct ? 'Edit Product' : 'Add new product'}</h2>

          <div className="form-group">
            <label>Attach Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
            />
            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img, idx) => (
                  <div key={idx} className="image-preview">
                    <img src={img} alt={`Preview ${idx}`} />
                    <button
                      onClick={() => {
                        setImages(images.filter((_, i) => i !== idx));
                      }}
                      className="remove-image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Product Name</label>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Enter product name"
              defaultValue=""
            />
          </div>
          
          <div className="form-group">
            <label>Product Price</label>
            <input
              ref={priceInputRef}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter product price"
              defaultValue=""
            />
          </div>

          <div className="form-group">
            <label>Product Description</label>
            <textarea
              ref={descriptionInputRef}
              placeholder="Enter product description"
              defaultValue=""
            />
          </div>

          <div className="form-group">
            <label>Product Category</label>
            <select ref={categoryInputRef} defaultValue="Wedding">
              <option>Wedding</option>
              <option>Uniform</option>
              <option>More</option>
            </select>
          </div>

          

          <button 
            onClick={addProduct} 
            className="btn-submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );

  const ViewAllPage = () => (
    <div className="page-container">
      <div className="container-small">
        <button onClick={() => setCurrentPage('home')} className="back-btn">
          ←
        </button>

        <div className="form-card">
          <h2>All Products</h2>

          <div className="search-single">
            <input
              ref={searchViewRef}
              type="text"
              placeholder="Search by Anything ...."
              onInput={handleSearchChange}
              defaultValue={searchTerm}
            />
          </div>

          <div className="product-list">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-list-item">
                <div>
                  <h3>{product.name}</h3>
                  <p>Price - ${product.price}</p>
                  <p>Category - {product.category}</p>
                  <p>{product.description}</p>
                </div>
                <div className="list-actions">
                  <button onClick={() => startEdit(product)}>✎</button>
                  <button onClick={() => deleteProduct(product.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-products">No products found</div>
          )}
        </div>
      </div>
    </div>
  );

  const ProductDetailPage = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!selectedProduct) return null;

    return (
      <div className="page-container">
        <div className="container-small">
          <button onClick={() => setCurrentPage('listing')} className="back-btn">
            ←
          </button>

          <div className="breadcrumb">
            {selectedProduct.category} &gt; {selectedProduct.name}
          </div>

          <div className="detail-card">
            <div className="detail-image">
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <>
                  <img
                    src={selectedProduct.images[currentImageIndex]}
                    alt={selectedProduct.name}
                  />
                  {selectedProduct.images.length > 1 && (
                    <>
                      <button
                        className="nav-btn-large left"
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev > 0 ? prev - 1 : selectedProduct.images.length - 1
                          )
                        }
                      >
                        ‹
                      </button>
                      <button
                        className="nav-btn-large right"
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev < selectedProduct.images.length - 1 ? prev + 1 : 0
                          )
                        }
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="no-image-large">No Image</div>
              )}
            </div>

            <div className="detail-info">
              <h1>$ {selectedProduct.price}</h1>
              <h2>{selectedProduct.name}</h2>
              <div>
                <h3>Description</h3>
                <p>{selectedProduct.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-content">
          <h1 onClick={() => setCurrentPage('home')}>Artisans</h1>
          <div className="nav-links">
            <button>About</button>
            <button>Contact</button>
            <button>Help</button>
            <span>|</span>
            <button>Login</button>
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