import msgpack from 'msgpack-lite';

/**
 * Decompress MessagePack data
 * @param {ArrayBuffer} compressedData - Compressed binary data
 * @returns {Object} Decompressed data
 */
export const decompressMissionsData = (compressedData) => {
    try {
        console.log('🔧 Decompressing MessagePack data...');
        const startTime = performance.now();
        
        // Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(compressedData);
        
        // Decode MessagePack data
        const decompressed = msgpack.decode(uint8Array);
        
        const endTime = performance.now();
        console.log(`✅ MessagePack decompression completed in ${(endTime - startTime).toFixed(2)}ms`);
        
        return decompressed;
    } catch (error) {
        console.error('❌ Failed to decompress MessagePack data:', error);
        throw error;
    }
};

/**
 * Compress data to MessagePack (for testing)
 * @param {Object} data - Data to compress
 * @returns {Uint8Array} Compressed binary data
 */
export const compressMissionsData = (data) => {
    try {
        console.log('🔧 Compressing data to MessagePack...');
        const startTime = performance.now();
        
        // Encode data to MessagePack
        const compressed = msgpack.encode(data);
        
        const endTime = performance.now();
        console.log(`✅ MessagePack compression completed in ${(endTime - startTime).toFixed(2)}ms`);
        
        return compressed;
    } catch (error) {
        console.error('❌ Failed to compress data to MessagePack:', error);
        throw error;
    }
};

/**
 * Get compression ratio
 * @param {Object} originalData - Original data
 * @param {Uint8Array} compressedData - Compressed data
 * @returns {Object} Compression statistics
 */
export const getCompressionStats = (originalData, compressedData) => {
    const originalSize = JSON.stringify(originalData).length;
    const compressedSize = compressedData.length;
    const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    return {
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: `${ratio}%`,
        sizeReduction: `${((originalSize - compressedSize) / 1024 / 1024).toFixed(2)}MB`
    };
};
