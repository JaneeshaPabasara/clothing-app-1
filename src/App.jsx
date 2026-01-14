import React, { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import './App.css';
import Landing from './assets/Landing.jpg';
import Wedding from './assets/Wedding.png';
import uniform from './assets/uniform.png';
import more from './assets/more.png';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';


const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'artisans2025';

// Image compression function
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions for img
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// AuthPage comp
const AuthPage = memo(({ setCurrentPage, setIsAuthenticated, targetPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setCurrentPage(targetPage);
      setError('');
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  };

  return (
    <div className="page-container">
      <div className="container-small">
        <button onClick={() => setCurrentPage('home')} className="back-btn">
          ←
        </button>

        <div className="form-card">
          <h2>Admin Login</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Please enter your credentials to access inventory management
          </p>

          <div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
              />
            </div>

            {error && (
              <div style={{ 
                color: '#dc2626', 
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fee2e2',
                borderRadius: '8px'
              }}>
                {error}
              </div>
            )}

            <button onClick={handleLogin} className="btn-submit">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

AuthPage.displayName = 'AuthPage';

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

// HomePage Component
const HomePage = memo(({ 
  loading, 
  products, 
  handleCategoryClick, 
  setCurrentPage, 
  setSelectedCategory,
  handleInventoryAction
}) => {
  const weddingCount = products.filter((p) => p.category === 'Wedding').length;
  const uniformCount = products.filter((p) => p.category === 'Uniform').length;
  const moreCount = products.filter((p) => p.category === 'More').length;

  return (
    <div className="home-page">
      <header className="hero-section" style={{ backgroundImage: `url(${Landing})` }}>
        <div className="hero-content">
          <div className="hero-text">
            <h1>Tailored Perfection for Every Style</h1>
            <p>From Fabric to Fashion – Designed by Artisans</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage('listing');
              }}
              className="btn-primary1"
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
              image={Wedding}
              onClick={handleCategoryClick}
            />
            <CategoryCard
              title="Uniform"
              count={uniformCount}
              category="Uniform"
              image={uniform}
              onClick={handleCategoryClick}
            />
            <CategoryCard
              title="More"
              count={moreCount}
              category="More"
              image={more}
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
              <button onClick={() => handleInventoryAction('add')} className="btn-secondary">
                Add +
              </button>
            </div>
            <div className="inventory-row">
              <h3>View All Products</h3>
              <button onClick={() => handleInventoryAction('view')} className="btn-secondary">
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
});

HomePage.displayName = 'HomePage';

// ListingPage Component
const ListingPage = memo(({ 
  setCurrentPage, 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  filteredProducts, 
  handleViewProduct 
}) => (
  <div className="page-container">
    <div className="container">
      <button onClick={() => setCurrentPage('home')} className="back-btn">
        ←
      </button>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search for anything..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
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
));

ListingPage.displayName = 'ListingPage';

// ViewAllPage Component
const ViewAllPage = memo(({ 
  setCurrentPage, 
  searchQuery, 
  setSearchQuery, 
  filteredProducts, 
  startEdit, 
  deleteProduct,
  handleLogout
}) => (
  <div className="page-container">
    <div className="container-small">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setCurrentPage('home')} className="back-btn">
          ←
        </button>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>

      <div className="form-card">
        <h2>All Products</h2>

        <div className="search-single">
          <input
            type="text"
            placeholder="Search by Anything ...."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
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
));

ViewAllPage.displayName = 'ViewAllPage';

// AddProductPage Component
const AddProductPage = memo(({ 
  setCurrentPage, 
  editingProduct, 
  setEditingProduct, 
  images, 
  setImages, 
  handleImageUpload, 
  nameInputRef, 
  priceInputRef, 
  descriptionInputRef, 
  categoryInputRef, 
  addProduct, 
  saving,
  handleLogout,
  uploadProgress
}) => (
  <div className="page-container">
    <div className="container-small">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>

      <div className="form-card">
        <h2>{editingProduct ? 'Edit Product' : 'Add new product'}</h2>

        <div className="form-group">
          <label>Attach Images (max 3 images recommended)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Images will be automatically compressed for mobile compatibility
          </p>
          {uploadProgress && (
            <p style={{ fontSize: '14px', color: '#7c3aed', marginTop: '8px' }}>
              {uploadProgress}
            </p>
          )}
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
));

AddProductPage.displayName = 'AddProductPage';

// ProductDetailPage Component
const ProductDetailPage = memo(({ selectedProduct, setCurrentPage }) => {
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
});

ProductDetailPage.displayName = 'ProductDetailPage';

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [targetPage, setTargetPage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState('');

  const nameInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const categoryInputRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products?.length) return [];
    
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (!searchQuery) return filtered;
    
    const search = searchQuery.toLowerCase().trim();
    
    return filtered.filter(product => {
      try {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const price = (product.price || '').toString().toLowerCase();
        const id = (product.id || '').toString().toLowerCase();

        return name.includes(search) ||
               description.includes(search) ||
               category.includes(search) ||
               price.includes(search) ||
               id.includes(search);
      } catch (error) {
        console.error('Error filtering product:', product, error);
        return false;
      }
    });
  }, [products, selectedCategory, searchQuery]);

  const loadProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error loading products: ' + error.message);
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Limit to 3 images max
    if (images.length + files.length > 3) {
      alert('Maximum 3 images allowed per product');
      return;
    }

    setUploadProgress(`Compressing ${files.length} image(s)...`);

    try {
      const compressedImages = await Promise.all(
        files.map(async (file, index) => {
          setUploadProgress(`Compressing image ${index + 1} of ${files.length}...`);
          // Compress image: max width 800px, quality 0.6 for mobile compatibility
          return await compressImage(file, 800, 0.6);
        })
      );

      setImages(prev => [...prev, ...compressedImages]);
      setUploadProgress('');
    } catch (error) {
      console.error('Error compressing images:', error);
      alert('Error processing images. Please try again.');
      setUploadProgress('');
    }
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

    // Check if images are too large
    const totalSize = images.reduce((acc, img) => acc + img.length, 0);
    const estimatedMB = (totalSize * 0.75) / (1024 * 1024); // Estimate actual size
    
    if (estimatedMB > 0.8) {
      alert('Images are too large. Please use fewer images or lower quality images.');
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
      
      if (nameInputRef.current) nameInputRef.current.value = '';
      if (priceInputRef.current) priceInputRef.current.value = '';
      if (descriptionInputRef.current) descriptionInputRef.current.value = '';
      if (categoryInputRef.current) categoryInputRef.current.value = 'Wedding';
      setImages([]);
      
      await loadProducts();
      setCurrentPage('view');
    } catch (error) {
      console.error('Error adding/updating product:', error);
      if (error.message.includes('1048487')) {
        alert('Images are too large for mobile. Please reduce the number of images or image quality.');
      } else {
        alert('Error saving product: ' + error.message);
      }
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
    
    setTimeout(() => {
      if (nameInputRef.current) nameInputRef.current.value = product.name;
      if (priceInputRef.current) priceInputRef.current.value = product.price;
      if (descriptionInputRef.current) descriptionInputRef.current.value = product.description;
      if (categoryInputRef.current) categoryInputRef.current.value = product.category;
    }, 50);
  }, []);

  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setCurrentPage('listing');
  }, []);

  const handleInventoryAction = useCallback((page) => {
    if (!isAuthenticated) {
      setTargetPage(page);
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
    }
  }, [isAuthenticated]);

  const handleViewProduct = useCallback((product) => {
    setSelectedProduct(product);
    setCurrentPage('detail');
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentPage('home');
    alert('Logged out successfully');
  }, []);

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

      {currentPage === 'auth' && (
        <AuthPage 
          setCurrentPage={setCurrentPage}
          setIsAuthenticated={setIsAuthenticated}
          targetPage={targetPage}
        />
      )}
      {currentPage === 'home' && (
        <HomePage 
          loading={loading}
          products={products}
          handleCategoryClick={handleCategoryClick}
          setCurrentPage={setCurrentPage}
          setSelectedCategory={setSelectedCategory}
          handleInventoryAction={handleInventoryAction}
        />
      )}
      {currentPage === 'listing' && (
        <ListingPage 
          setCurrentPage={setCurrentPage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          filteredProducts={filteredProducts}
          handleViewProduct={handleViewProduct}
        />
      )}
      {currentPage === 'add' && (
        <AddProductPage 
          setCurrentPage={setCurrentPage}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          images={images}
          setImages={setImages}
          handleImageUpload={handleImageUpload}
          nameInputRef={nameInputRef}
          priceInputRef={priceInputRef}
          descriptionInputRef={descriptionInputRef}
          categoryInputRef={categoryInputRef}
          addProduct={addProduct}
          saving={saving}
          handleLogout={handleLogout}
          uploadProgress={uploadProgress}
        />
      )}
      {currentPage === 'view' && (
        <ViewAllPage 
          setCurrentPage={setCurrentPage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredProducts={filteredProducts}
          startEdit={startEdit}
          deleteProduct={deleteProduct}
          handleLogout={handleLogout}
        />
      )}
      {currentPage === 'detail' && (
        <ProductDetailPage 
          selectedProduct={selectedProduct}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
};

export default App;