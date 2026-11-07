import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Sprout, Save, ArrowLeft } from 'lucide-react';

const EditVegetable = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vegetable_name: '',
    category: '',
    description: '',
    price: '',
    quantity: '',
    sold_by: 'weight'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Leafy Greens',
    'Root Vegetables',
    'Nightshades',
    'Cruciferous',
    'Pods & Beans',
    'Gourds & Squashes'
  ];

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await API.get(`/vegetables/${id}`);
        setFormData({
          vegetable_name: res.data.vegetable_name,
          category: res.data.category,
          description: res.data.description || '',
          price: res.data.price,
          quantity: res.data.quantity,
          sold_by: res.data.sold_by || 'weight'
        });
        setImagePreview(res.data.image && res.data.image.startsWith('http') ? res.data.image : `/uploads/${res.data.image}`);
      } catch (err) {
        setError('Failed to fetch vegetable details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

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
    setSubmitting(true);

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

      await API.put(`/vegetables/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Vegetable updated successfully!');
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vegetable.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message={t('common.loading')} />;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '640px' }}>
      <Link to="/farmer/dashboard" className="btn btn-outline btn-sm" style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> {t('farmerDashboard.backToDashboard')}
      </Link>

      <div className="card" style={{ padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '12px', color: '#2e7d32' }}>
            <Sprout size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' }}>{t('farmerDashboard.editVegTitle')}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('farmerDashboard.editVegSub')}</p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('farmerDashboard.productName')}</label>
            <input
              type="text"
              required
              className="form-control"
              value={formData.vegetable_name}
              onChange={(e) => setFormData({ ...formData, vegetable_name: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('filter.categoryLabel')}</label>
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

            <div className="form-group">
              <label className="form-label">
                {formData.sold_by === 'piece' ? 'Price per Piece (₹)' : t('farmerDashboard.pricePerKgLabel')}
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="form-control"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Sold By (Unit Type)</label>
              <select
                className="form-control"
                value={formData.sold_by || 'weight'}
                onChange={(e) => setFormData({ ...formData, sold_by: e.target.value })}
              >
                <option value="weight">By Weight (per kg / grams: 250g, 500g, 1kg)</option>
                <option value="piece">By Piece (per piece / count: 1 pc, 2 pcs)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {formData.sold_by === 'piece' ? 'Available Stock (Pieces)' : t('farmerDashboard.availableStock')}
              </label>
              <input
                type="number"
                required
                className="form-control"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('farmerDashboard.productDesc')}</label>
            <textarea
              rows="3"
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">{t('farmerDashboard.changeImage')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="form-control"
            />
            {imagePreview && (
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt="Crop Preview"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60'; }}
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #2e7d32' }}
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
            <Save size={18} /> {submitting ? t('farmerDashboard.savingBtn') : t('farmerDashboard.saveChangesBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditVegetable;
