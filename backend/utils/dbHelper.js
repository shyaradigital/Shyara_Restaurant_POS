import mongoose from 'mongoose';

/**
 * Check if MongoDB is connected and ready
 * @returns {boolean} True if MongoDB is connected, false otherwise
 */
export const isMongoConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

/**
 * Execute a MongoDB operation with timeout and connection check
 * @param {Function} operation - The MongoDB operation to execute
 * @param {number} timeoutMs - Timeout in milliseconds (default: 3000)
 * @returns {Promise} The result of the operation or null if failed
 */
export const safeMongoOperation = async (operation, timeoutMs = 3000) => {
  // If not connected, don't even try
  if (!isMongoConnected()) {
    return null;
  }

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB operation timeout')), timeoutMs);
    });

    // Race between the operation and timeout
    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } catch (error) {
    // If it's a timeout or connection error, return null
    if (error.message.includes('timeout') || 
        error.message.includes('buffering') ||
        error.message.includes('connection')) {
      return null;
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Try MongoDB operation, fallback to in-memory if it fails
 * @param {Function} mongoOperation - MongoDB operation
 * @param {Function} fallbackOperation - Fallback operation (in-memory)
 * @returns {Promise} Result from either MongoDB or fallback
 */
export const tryMongoWithFallback = async (mongoOperation, fallbackOperation) => {
  if (!isMongoConnected()) {
    return await fallbackOperation();
  }

  try {
    const result = await safeMongoOperation(mongoOperation, 3000);
    if (result !== null) {
      return result;
    }
  } catch (error) {
    // MongoDB operation failed, use fallback
  }

  return await fallbackOperation();
};

