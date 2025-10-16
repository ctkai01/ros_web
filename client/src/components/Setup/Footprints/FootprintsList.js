import React from 'react';
import './Footprints.css';

const FootprintsList = ({ footprints, onEdit, onDelete }) => {
    if (!footprints.length) {
        return <div className="no-footprints">No footprints found</div>;
    }

    return (
        <div className="footprints-list">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {footprints.map((footprint) => (
                        <tr key={footprint.ID}>
                            <td>{footprint.Name}</td>
                            <td>{footprint.isDefaut}</td>
                          
                            <td className="actions-cell">
                                <button
                                    className="edit-button"
                                    onClick={() => onEdit(footprint)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={() => onDelete(footprint.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FootprintsList; 