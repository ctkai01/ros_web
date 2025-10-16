import React, { useState, useEffect } from 'react';
import './Footprints.css';

const FootprintForm = ({ footprint, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        coordinates: '',
        // Add any other fields that your footprint model requires
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (footprint) {
            setFormData({
                name: footprint.name || '',
                description: footprint.description || '',
                coordinates: footprint.coordinates || '',
                // Initialize other fields from footprint data
            });
        }
    }, [footprint]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.coordinates.trim()) {
            newErrors.coordinates = 'Coordinates are required';
        }
        // Add validation for other fields as needed
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(footprint?.id, formData);
        }
    };

    return (
        <div className="footprint-form-overlay">
            <div className="footprint-form-container">
                <h3>{footprint ? 'Edit Footprint' : 'Create New Footprint'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'error' : ''}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="coordinates">Coordinates:</label>
                        <input
                            type="text"
                            id="coordinates"
                            name="coordinates"
                            value={formData.coordinates}
                            onChange={handleChange}
                            className={errors.coordinates ? 'error' : ''}
                            placeholder="Format: x,y,z"
                        />
                        {errors.coordinates && (
                            <span className="error-message">{errors.coordinates}</span>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="submit-button">
                            {footprint ? 'Update' : 'Create'}
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FootprintForm; 