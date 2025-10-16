import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SERVER_URL, apiCallWithRetry } from '../../../config/serverConfig';
import './Footprints.css';
import FootprintsList from './FootprintsList';
import FootprintForm from './FootprintForm';

const Footprints = () => {
    const [footprints, setFootprints] = useState([]);
    const [selectedFootprint, setSelectedFootprint] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch footprints on component mount
    useEffect(() => {
        fetchFootprints();
    }, []);

    const fetchFootprints = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const headers = {
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            const response = await apiCallWithRetry(`${SERVER_URL}/api/footprints/`);
           
            setFootprints( Array.isArray(response) ? response : []);
            console.log("response resp",response);
            setError(null);
        } catch (err) {
            setError('Failed to fetch footprints');
            console.error('Error fetching footprints:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (footprintData) => {
        try {
            console.log('footprintData,',footprintData);
            setLoading(true);
            const response = await apiCallWithRetry('POST', `${SERVER_URL}/api/footprints`, footprintData);
            setFootprints([...footprints, response.data]);
            setIsFormOpen(false);
            setError(null);
        } catch (err) {
            setError('Failed to create footprint');
            console.error('Error creating footprint:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, footprintData) => {
        try {
            setLoading(true);
         
            const response = await apiCallWithRetry('PUT', `${SERVER_URL}/api/footprints/${id}`, footprintData);
            setFootprints(footprints.map(fp => fp.id === id ? response.data : fp));
            setSelectedFootprint(null);
            setIsFormOpen(false);
            setError(null);
        } catch (err) {
            setError('Failed to update footprint');
            console.error('Error updating footprint:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this footprint?')) {
            try {
                setLoading(true);
                await apiCallWithRetry('DELETE', `${SERVER_URL}/api/footprints/${id}`);
                setFootprints(footprints.filter(fp => fp.id !== id));
                setError(null);
            } catch (err) {
                setError('Failed to delete footprint');
                console.error('Error deleting footprint:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEdit = (footprint) => {
        setSelectedFootprint(footprint);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setSelectedFootprint(null);
        setIsFormOpen(false);
    };

    return (
        <div className="footprints-container">
            <div className="footprints-header">
                <h2>Footprints Management</h2>
                <button 
                    className="create-button"
                    onClick={() => setIsFormOpen(true)}
                >
                    Create New Footprint
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            {loading && <div className="loading-spinner">Loading...</div>}

            {isFormOpen && (
                <FootprintForm
                    footprint={selectedFootprint}
                    onSubmit={selectedFootprint ? handleUpdate : handleCreate}
                    onClose={handleFormClose}
                />
            )}

            <FootprintsList
                footprints={footprints}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default Footprints; 