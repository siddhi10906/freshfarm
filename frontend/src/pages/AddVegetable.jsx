import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import { Sprout, Upload, ArrowLeft, Image, CheckCircle2 } from 'lucide-react';

const AddVegetable = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vegetable_name: '',
    category: 'Nightshades',
    description: '',
    price: '',
    quantity: '',
    sold_by: 'weight'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Leafy Greens',
    'Root Vegetables',
    'Nightshades',
    'Cruciferous',
    'Pods & Beans',
    'Gourds & Squashes'
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('vegetable_name', formData.vegetable_name);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('quantity', formData.quantity);
      data.append('sold_by', formData.sold_by || 'weight');
      if (imageFile) {
        data.append('image', imageFile);
      }

      await API.post('/vegetables', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Vegetable added successfully to FreshFarm marketplace!');
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vegetable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', background: '#f8fafc', padding: '30px 0 60px 0' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <Link to="/farmer/dashboard" className="btn btn-outline btn-sm" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> {t('farmerDashboard.backToDashboard')}
        </Link>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{t('farmerDashboard.addProductTitle')}</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>{t('farmerDashboard.addProductSub')}</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
          {/* Left Column: Basic Details, Pricing & Inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Basic Details Card */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                {t('farmerDashboard.basicDetails')}
              </h3>

              <div className="form-group">
                <label className="form-label">{t('farmerDashboard.productName')}</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder={t('farmerDashboard.productNamePlaceholder')}
                  value={formData.vegetable_name}
                  onChange={(e) => setFormData({ ...formData, vegetable_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('farmerDashboard.productDesc')}</label>
                <textarea
                  rows="4"
                  className="form-control"
                  placeholder={t('farmerDashboard.productDescPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                {t('farmerDashboard.pricing')}
              </h3>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    {formData.sold_by === 'piece' ? 'Price per Piece (₹)' : formData.sold_by === 'dozen' ? 'Price per Dozen (₹)' : t('farmerDashboard.pricePerKgLabel')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="form-control"
                    placeholder="e.g. 40"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sold By (Unit Type)</label>
                  <select
                    className="form-control"
                    value={formData.sold_by || 'weight'}
                    onChange={(e) => setFormData({ ...formData, sold_by: e.target.value })}
                  >
                    <option value="weight">By Weight (per kg / grams: 250g, 500g, 1kg)</option>
                    <option value="piece">By Piece (per piece / count: 1 pc, 2 pcs)</option>
                    <option value="dozen">By Dozen (12 pieces per dozen)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                {t('farmerDashboard.inventoryCard')}
              </h3>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{formData.sold_by === 'piece' ? 'Stock Quantity (pieces)' : formData.sold_by === 'dozen' ? 'Stock Quantity (dozens)' : t('farmerDashboard.stockQtyLabel')}</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    placeholder="e.g. 150"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('farmerDashboard.stockStatus')}</label>
                  <select className="form-control">
                    <option value="in_stock">{t('farmerDashboard.inStockBadge')}</option>
                    <option value="out_stock">{t('product.outOfStock')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Upload Image & Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upload Product Image Box */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                {t('farmerDashboard.uploadImage')}
              </h3>

              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '14px', padding: '30px 20px', textAlign: 'center', background: '#f8fafc', marginBottom: '16px' }}>
                {imagePreview ? (
                  <div>
                    <img
                      src={imagePreview}
                      alt="Crop Preview"
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '700' }}>{t('farmerDashboard.imageLoaded')}</span>
                  </div>
                ) : (
                  <div>
                    <Image size={40} color="#94a3b8" style={{ marginBottom: '10px' }} />
                    <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: '600' }}>{t('farmerDashboard.dragDropImage')}</div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t('farmerDashboard.supportedFormats')}</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="crop-image-input"
                />

                <label htmlFor="crop-image-input" className="btn btn-outline btn-sm" style={{ marginTop: '14px', cursor: 'pointer' }}>
                  {t('farmerDashboard.browseFile')}
                </label>
              </div>
            </div>

            {/* Category Select Card */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                {t('farmerDashboard.categoriesCard')}
              </h3>

              <div className="form-group">
                <label className="form-label">{t('farmerDashboard.productCategory')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-control"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{t(`categories.${cat.toLowerCase()}`, cat)}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#15803d', marginTop: '10px' }}>
                <Upload size={18} /> {loading ? t('farmerDashboard.publishingBtn') : t('farmerDashboard.createProductBtn')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVegetable;
