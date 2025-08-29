/**
 * Payment Processing Core Module
 * 
 * Handles payment processing operations for the
 * Ojalá Healthcare Platform, including payment method management,
 * transaction processing, and payment gateway integration.
 */

class PaymentProcessor {
  constructor(options = {}) {
    this.options = {
      defaultCurrency: 'USD',
      paymentGateway: 'stripe',
      autoRetryFailedPayments: true,
      maxRetryAttempts: 3,
      retryInterval: 24 * 60 * 60 * 1000, // 24 hours
      securePaymentInfo: true,
      ...options
    };
    
    // Dependencies will be injected
    this.stripeService = null;
    this.dataStore = null;
    this.notificationService = null;
    this.logger = null;
    
    // Payment retry queue
    this.retryQueue = new Map();
  }
  
  /**
   * Initialize the payment processor with dependencies
   * 
   * @param {Object} dependencies - Service dependencies
   */
  initialize(dependencies) {
    const { 
      stripeService, 
      dataStore, 
      notificationService,
      logger
    } = dependencies;
    
    this.stripeService = stripeService;
    this.dataStore = dataStore;
    this.notificationService = notificationService;
    this.logger = logger;
    
    this._log('info', 'Payment processor initialized');
    
    // Initialize retry mechanism
    if (this.options.autoRetryFailedPayments) {
      this._initializeRetryMechanism();
    }
  }
  
  /**
   * Create a payment method
   * 
   * @param {Object} params - Payment method parameters
   * @param {string} params.organizationId - Organization ID
   * @param {string} params.type - Payment method type (credit_card, ach, etc.)
   * @param {Object} params.details - Payment method details
   * @param {boolean} [params.isDefault] - Whether this is the default payment method
   * @param {Object} [params.metadata] - Additional metadata
   * @returns {Promise<Object>} Created payment method
   */
  async createPaymentMethod(params) {
    try {
      const {
        organizationId,
        type,
        details,
        isDefault = false,
        metadata = {}
      } = params;
      
      // Validate required parameters
      if (!organizationId) throw new Error('Organization ID is required');
      if (!type) throw new Error('Payment method type is required');
      if (!details) throw new Error('Payment method details are required');
      
      // Validate payment method type
      const validTypes = ['credit_card', 'ach', 'wire_transfer'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid payment method type: ${type}`);
      }
      
      // Create payment method in payment gateway
      let gatewayToken = null;
      let gatewayData = null;
      
      if (this.stripeService && (type === 'credit_card' || type === 'ach')) {
        const gatewayResult = await this.stripeService.createPaymentMethod({
          type,
          details,
          metadata: {
            organizationId
          }
        });
        
        gatewayToken = gatewayResult.id;
        gatewayData = gatewayResult;
      }
      
      // Create payment method record
      const now = new Date();
      const paymentMethod = {
        id: this._generateId('pm_'),
        organizationId,
        type,
        gatewayToken,
        gatewayData: this.options.securePaymentInfo ? null : gatewayData,
        isDefault,
        status: 'active',
        lastUsed: null,
        expirationDate: details.expirationDate,
        metadata,
        createdAt: now,
        updatedAt: now
      };
      
      // Store payment method in database
      const createdPaymentMethod = await this.dataStore.createPaymentMethod(paymentMethod);
      
      // If this is the default payment method, update other payment methods
      if (isDefault) {
        await this._updateDefaultPaymentMethod(organizationId, createdPaymentMethod.id);
      }
      
      // Send notification
      await this._sendPaymentMethodNotification('created', createdPaymentMethod);
      
      this._log('info', 'Payment method created', {
        paymentMethodId: createdPaymentMethod.id,
        organizationId,
        type
      });
      
      return createdPaymentMethod;
    } catch (error) {
      this._log('error', 'Failed to create payment method', {
        error: error.message,
        organizationId: params.organizationId,
        type: params.type
      });
      
      throw error;
    }
  }
  
  /**
   * Get payment method by ID
   * 
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Payment method
   */
  async getPaymentMethod(paymentMethodId) {
    try {
      if (!paymentMethodId) throw new Error('Payment method ID is required');
      
      const paymentMethod = await this.dataStore.getPaymentMethod(paymentMethodId);
      
      if (!paymentMethod) {
        throw new Error(`Payment method not found: ${paymentMethodId}`);
      }
      
      return paymentMethod;
    } catch (error) {
      this._log('error', 'Failed to get payment method', {
        error: error.message,
        paymentMethodId
      });
      
      throw error;
    }
  }
  
  /**
   * Get payment methods for organization
   * 
   * @param {string} organizationId - Organization ID
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} Payment methods
   */
  async getOrganizationPaymentMethods(organizationId, options = {}) {
    try {
      if (!organizationId) throw new Error('Organization ID is required');
      
      return await this.dataStore.getPaymentMethodsByOrganization(organizationId, options);
    } catch (error) {
      this._log('error', 'Failed to get organization payment methods', {
        error: error.message,
        organizationId
      });
      
      throw error;
    }
  }
  
  /**
   * Update payment method
   * 
   * @param {string} paymentMethodId - Payment method ID
   * @param {Object} updates - Payment method updates
   * @returns {Promise<Object>} Updated payment method
   */
  async updatePaymentMethod(paymentMethodId, updates) {
    try {
      if (!paymentMethodId) throw new Error('Payment method ID is required');
      if (!updates) throw new Error('Updates are required');
      
      // Get current payment method
      const paymentMethod = await this.getPaymentMethod(paymentMethodId);
      
      // Check if payment method can be updated
      if (paymentMethod.status !== 'active') {
        throw new Error(`Cannot update payment method with status: ${paymentMethod.status}`);
      }
      
      // Prepare updates
      const allowedUpdates = [
        'expirationDate',
        'isDefault',
        'metadata'
      ];
      
      const validUpdates = {};
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          validUpdates[key] = updates[key];
        }
      }
      
      validUpdates.updatedAt = new Date();
      
      // Update payment method in database
      const updatedPaymentMethod = await this.dataStore.updatePaymentMethod(
        paymentMethodId,
        validUpdates
      );
      
      // If this is now the default payment method, update other payment methods
      if (updates.isDefault === true) {
        await this._updateDefaultPaymentMethod(paymentMethod.organizationId, paymentMethodId);
      }
      
      // Send notification
      await this._sendPaymentMethodNotification('updated', updatedPaymentMethod);
      
      this._log('info', 'Payment method updated', {
        paymentMethodId,
        updates: Object.keys(validUpdates)
      });
      
      return updatedPaymentMethod;
    } catch (error) {
      this._log('error', 'Failed to update payment method', {
        error: error.message,
        paymentMethodId
      });
      
      throw error;
    }
  }
  
  /**
   * Delete payment method
   * 
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePaymentMethod(paymentMethodId) {
    try {
      if (!paymentMethodId) throw new Error('Payment method ID is required');
      
      // Get current payment method
      const paymentMethod = await this.getPaymentMethod(paymentMethodId);
      
      // Check if this is the default payment method
      if (paymentMethod.isDefault) {
        // Check if there are other payment methods
        const otherPaymentMethods = await this.dataStore.getPaymentMethodsByOrganization(
          paymentMethod.organizationId,
          { excludeId: paymentMethodId, status: 'active' }
        );
        
        if (otherPaymentMethods.length === 0) {
          throw new Error('Cannot delete the only default payment method');
        }
      }
      
      // Delete payment method in payment gateway
      if (this.stripeService && paymentMethod.gatewayToken) {
        await this.stripeService.deletePaymentMethod(paymentMethod.gatewayToken);
      }
      
      // Update payment method in database
      const updates = {
        status: 'deleted',
        updatedAt: new Date()
      };
      
      await this.dataStore.updatePaymentMethod(paymentMethodId, updates);
      
      // If this was the default payment method, set another one as default
      if (paymentMethod.isDefault) {
        const otherPaymentMethods = await this.dataStore.getPaymentMethodsByOrganization(
          paymentMethod.organizationId,
          { excludeId: paymentMethodId, status: 'active' }
        );
        
        if (otherPaymentMethods.length > 0) {
          await this.updatePaymentMethod(otherPaymentMethods[0].id, { isDefault: true });
        }
      }
      
      // Send notification
      await this._sendPaymentMethodNotification('deleted', paymentMethod);
      
      this._log('info', 'Payment method deleted', {
        paymentMethodId,
        organizationId: paymentMethod.organizationId
      });
      
      return true;
    } catch (error) {
      this._log('error', 'Failed to delete payment method', {
        error: error.message,
        paymentMethodId
      });
      
      throw error;
    }
  }
  
  /**
   * Create a charge
   * 
   * @param {Object} params - Charge parameters
   * @param {number} params.amount - Charge amount
   * @param {string} [params.currency] - Currency code
   * @param {string} params.paymentMethodId - Payment method ID
   * @param {string} [params.description] - Charge description
   * @param {Object} [params.metadata] - Additional metadata
   * @returns {Promise<Object>} Created charge
   */
  async createCharge(params) {
    try {
      const {
        amount,
        currency = this.options.defaultCurrency,
        paymentMethodId,
        description = 'Charge',
        metadata = {}
      } = params;
      
      // Validate required parameters
      if (amount === undefined) throw new Error('Amount is required');
      if (amount <= 0) throw new Error('Amount must be greater than zero');
      if (!paymentMethodId) throw new Error('Payment method ID is required');
      
      // Get payment method
      const paymentMethod = await this.getPaymentMethod(paymentMethodId);
      
      // Check if payment method is active
      if (paymentMethod.status !== 'active') {
        throw new Error(`Cannot charge payment method with status: ${paymentMethod.status}`);
      }
      
      // Process charge through payment gateway
      let gatewayChargeId = null;
      let gatewayResponse = null;
      
      if (this.stripeService && paymentMethod.gatewayToken) {
        const chargeResult = await this.stripeService.createCharge({
          amount,
          currency,
          paymentMethodId: paymentMethod.gatewayToken,
          description,
          metadata: {
            ...metadata,
            organizationId: paymentMethod.organizationId
          }
        });
        
        gatewayChargeId = chargeResult.id;
        gatewayResponse = chargeResult;
      } else {
        throw new Error('Payment gateway not available or payment method not supported');
      }
      
      // Create charge record
      const now = new Date();
      const charge = {
        id: this._generateId('ch_'),
        organizationId: paymentMethod.organizationId,
        paymentMethodId,
        amount,
        currency,
        description,
        status: 'succeeded',
        gatewayChargeId,
        gatewayResponse,
        metadata,
        createdAt: now,
        updatedAt: now
      };
      
      // Store charge in database
      const createdCharge = await this.dataStore.createCharge(charge);
      
      // Update payment method last used date
      await this.dataStore.updatePaymentMethod(paymentMethodId, {
        lastUsed: now,
        updatedAt: now
      });
      
      // Send notification
      await this._sendChargeNotification('succeeded', createdCharge);
      
      this._log('info', 'Charge created', {
        chargeId: createdCharge.id,
        organizationId: paymentMethod.organizationId,
        amount,
        currency
      });
      
      return createdCharge;
    } catch (error) {
      // Handle payment gateway errors
      const failedCharge = {
        id: this._generateId('ch_'),
        organizationId: params.organizationId || (await this.getPaymentMethod(params.paymentMethodId)).organizationId,
        paymentMethodId: params.paymentMethodId,
        amount: params.amount,
        currency: params.currency || this.options.defaultCurrency,
        description: params.description || 'Charge',
        status: 'failed',
        failureReason: error.message,
        metadata: params.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store failed charge in database
      await this.dataStore.createCharge(failedCharge);
      
      // Schedule retry if enabled
      if (this.options.autoRetryFailedPayments) {
        await this.scheduleRetry({
          chargeId: failedCharge.id,
          attempts: this.options.maxRetryAttempts
        });
      }
      
      // Send notification
      await this._sendChargeNotification('failed', failedCharge);
      
      this._log('error', 'Failed to create charge', {
        error: error.message,
        paymentMethodId: params.paymentMethodId,
        amount: params.amount
      });
      
      throw error;
    }
  }
  
  /**
   * Get charge by ID
   * 
   * @param {string} chargeId - Charge ID
   * @returns {Promise<Object>} Charge
   */
  async getCharge(chargeId) {
    try {
      if (!chargeId) throw new Error('Charge ID is required');
      
      const charge = await this.dataStore.getCharge(chargeId);
      
      if (!charge) {
        throw new Error(`Charge not found: ${chargeId}`);
      }
      
      return charge;
    } catch (error) {
      this._log('error', 'Failed to get charge', {
        error: error.message,
        chargeId
      });
      
      throw error;
    }
  }
  
  /**
   * Get charges for organization
   * 
   * @param {string} organizationId - Organization ID
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} Charges
   */
  async getOrganizationCharges(organizationId, options = {}) {
    try {
      if (!organizationId) throw new Error('Organization ID is required');
      
      return await this.dataStore.getChargesByOrganization(organizationId, options);
    } catch (error) {
      this._log('error', 'Failed to get organization charges', {
        error: error.message,
        organizationId
      });
      
      throw error;
    }
  }
  
  /**
   * Refund charge
   * 
   * @param {string} chargeId - Charge ID
   * @param {Object} [options] - Refund options
   * @returns {Promise<Object>} Refund
   */
  async refundCharge(chargeId, options = {}) {
    try {
      const {
        amount,
        reason = 'requested_by_customer',
        metadata = {}
      } = options;
      
      if (!chargeId) throw new Error('Charge ID is required');
      
      // Get charge
      const charge = await this.getCharge(charg
(Content truncated due to size limit. Use line ranges to read in chunks)