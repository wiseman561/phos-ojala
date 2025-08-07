/**
 * Pricing Models Core Module
 * 
 * Handles the pricing models and calculations for the
 * Ojalá Healthcare Platform, including plan definitions,
 * pricing tiers, and custom pricing.
 */

class PricingManager {
  constructor(options = {}) {
    this.options = {
      defaultCurrency: 'USD',
      taxEnabled: true,
      prorationEnabled: true,
      volumeDiscountsEnabled: true,
      customPricingEnabled: true,
      ...options
    };
    
    // Dependencies will be injected
    this.dataStore = null;
    this.taxService = null;
    this.logger = null;
    
    // Initialize plans
    this.plans = new Map();
    this.pricingTiers = new Map();
    this.customPricing = new Map();
  }
  
  /**
   * Initialize the pricing manager with dependencies
   * 
   * @param {Object} dependencies - Service dependencies
   */
  initialize(dependencies) {
    const { 
      dataStore, 
      taxService, 
      logger
    } = dependencies;
    
    this.dataStore = dataStore;
    this.taxService = taxService;
    this.logger = logger;
    
    // Load plans from database or config
    this._loadPlans();
    
    this._log('info', 'Pricing manager initialized');
  }
  
  /**
   * Register a plan
   * 
   * @param {Object} plan - Plan definition
   * @returns {boolean} Success status
   */
  registerPlan(plan) {
    try {
      // Validate plan
      this._validatePlan(plan);
      
      // Add plan to registry
      this.plans.set(plan.id, {
        ...plan,
        updatedAt: new Date()
      });
      
      // Register pricing tiers if provided
      if (plan.pricingTiers && Array.isArray(plan.pricingTiers)) {
        this.pricingTiers.set(plan.id, plan.pricingTiers);
      }
      
      this._log('info', `Plan registered: ${plan.id}`, {
        planId: plan.id,
        name: plan.name
      });
      
      return true;
    } catch (error) {
      this._log('error', 'Failed to register plan', {
        error: error.message,
        planId: plan.id
      });
      
      return false;
    }
  }
  
  /**
   * Get plan by ID
   * 
   * @param {string} planId - Plan ID
   * @returns {Object|null} Plan definition
   */
  getPlan(planId) {
    if (!planId) return null;
    
    return this.plans.get(planId) || null;
  }
  
  /**
   * Get all plans
   * 
   * @param {Object} [options] - Filter options
   * @returns {Array} Plans
   */
  getAllPlans(options = {}) {
    const { active, type } = options;
    
    let plans = Array.from(this.plans.values());
    
    // Filter by active status
    if (active !== undefined) {
      plans = plans.filter(plan => plan.active === active);
    }
    
    // Filter by type
    if (type) {
      plans = plans.filter(plan => plan.type === type);
    }
    
    return plans;
  }
  
  /**
   * Update plan
   * 
   * @param {string} planId - Plan ID
   * @param {Object} updates - Plan updates
   * @returns {Object|null} Updated plan
   */
  updatePlan(planId, updates) {
    try {
      if (!planId) throw new Error('Plan ID is required');
      
      // Get current plan
      const plan = this.getPlan(planId);
      if (!plan) throw new Error(`Plan not found: ${planId}`);
      
      // Prepare updates
      const allowedUpdates = [
        'name',
        'description',
        'price',
        'currency',
        'billingCycle',
        'features',
        'active',
        'trialEnabled',
        'trialDays',
        'metadata'
      ];
      
      const validUpdates = {};
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          validUpdates[key] = updates[key];
        }
      }
      
      validUpdates.updatedAt = new Date();
      
      // Update plan
      const updatedPlan = {
        ...plan,
        ...validUpdates
      };
      
      // Validate updated plan
      this._validatePlan(updatedPlan);
      
      // Save updated plan
      this.plans.set(planId, updatedPlan);
      
      // Update pricing tiers if provided
      if (updates.pricingTiers && Array.isArray(updates.pricingTiers)) {
        this.pricingTiers.set(planId, updates.pricingTiers);
      }
      
      this._log('info', `Plan updated: ${planId}`, {
        planId,
        updates: Object.keys(validUpdates)
      });
      
      return updatedPlan;
    } catch (error) {
      this._log('error', 'Failed to update plan', {
        error: error.message,
        planId
      });
      
      return null;
    }
  }
  
  /**
   * Delete plan
   * 
   * @param {string} planId - Plan ID
   * @returns {boolean} Success status
   */
  deletePlan(planId) {
    try {
      if (!planId) throw new Error('Plan ID is required');
      
      // Check if plan exists
      if (!this.plans.has(planId)) {
        throw new Error(`Plan not found: ${planId}`);
      }
      
      // Remove plan
      this.plans.delete(planId);
      
      // Remove pricing tiers
      this.pricingTiers.delete(planId);
      
      this._log('info', `Plan deleted: ${planId}`, {
        planId
      });
      
      return true;
    } catch (error) {
      this._log('error', 'Failed to delete plan', {
        error: error.message,
        planId
      });
      
      return false;
    }
  }
  
  /**
   * Register custom pricing for organization
   * 
   * @param {string} organizationId - Organization ID
   * @param {string} planId - Plan ID
   * @param {Object} customPricing - Custom pricing details
   * @returns {boolean} Success status
   */
  registerCustomPricing(organizationId, planId, customPricing) {
    try {
      if (!organizationId) throw new Error('Organization ID is required');
      if (!planId) throw new Error('Plan ID is required');
      if (!customPricing) throw new Error('Custom pricing details are required');
      
      // Check if plan exists
      const plan = this.getPlan(planId);
      if (!plan) throw new Error(`Plan not found: ${planId}`);
      
      // Validate custom pricing
      if (customPricing.price === undefined) {
        throw new Error('Custom price is required');
      }
      
      if (customPricing.price < 0) {
        throw new Error('Custom price cannot be negative');
      }
      
      // Create custom pricing record
      const customPricingRecord = {
        organizationId,
        planId,
        price: customPricing.price,
        currency: customPricing.currency || plan.currency,
        billingCycle: customPricing.billingCycle || plan.billingCycle,
        minQuantity: customPricing.minQuantity || 1,
        maxQuantity: customPricing.maxQuantity || null,
        startDate: customPricing.startDate || new Date(),
        endDate: customPricing.endDate || null,
        notes: customPricing.notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store custom pricing
      const key = `${organizationId}:${planId}`;
      this.customPricing.set(key, customPricingRecord);
      
      this._log('info', 'Custom pricing registered', {
        organizationId,
        planId,
        price: customPricing.price
      });
      
      return true;
    } catch (error) {
      this._log('error', 'Failed to register custom pricing', {
        error: error.message,
        organizationId,
        planId
      });
      
      return false;
    }
  }
  
  /**
   * Get custom pricing for organization and plan
   * 
   * @param {string} organizationId - Organization ID
   * @param {string} planId - Plan ID
   * @returns {Object|null} Custom pricing details
   */
  getCustomPricing(organizationId, planId) {
    if (!organizationId || !planId) return null;
    
    const key = `${organizationId}:${planId}`;
    return this.customPricing.get(key) || null;
  }
  
  /**
   * Calculate price for plan and quantity
   * 
   * @param {string} planId - Plan ID
   * @param {number} quantity - Quantity
   * @param {Object} options - Calculation options
   * @returns {Object} Price calculation result
   */
  calculatePrice(planId, quantity = 1, options = {}) {
    try {
      const {
        organizationId,
        includeTax = this.options.taxEnabled,
        billingAddress,
        prorated = false,
        proratedDays = 0
      } = options;
      
      if (!planId) throw new Error('Plan ID is required');
      
      // Get plan
      const plan = this.getPlan(planId);
      if (!plan) throw new Error(`Plan not found: ${planId}`);
      
      // Check if plan is active
      if (plan.active === false) {
        throw new Error(`Plan is not active: ${planId}`);
      }
      
      // Check for custom pricing
      let basePrice = plan.price;
      let currency = plan.currency;
      
      if (organizationId && this.options.customPricingEnabled) {
        const customPricing = this.getCustomPricing(organizationId, planId);
        
        if (customPricing) {
          // Check if custom pricing is applicable
          const now = new Date();
          const isActive = (!customPricing.startDate || customPricing.startDate <= now) &&
                          (!customPricing.endDate || customPricing.endDate >= now);
          
          const isQuantityValid = quantity >= customPricing.minQuantity &&
                                (!customPricing.maxQuantity || quantity <= customPricing.maxQuantity);
          
          if (isActive && isQuantityValid) {
            basePrice = customPricing.price;
            currency = customPricing.currency;
          }
        }
      }
      
      // Check for volume discounts
      if (this.options.volumeDiscountsEnabled && quantity > 1) {
        const pricingTiers = this.pricingTiers.get(planId);
        
        if (pricingTiers && pricingTiers.length > 0) {
          // Find applicable tier
          const applicableTier = pricingTiers
            .filter(tier => quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity))
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];
          
          if (applicableTier) {
            if (applicableTier.unitPrice !== undefined) {
              basePrice = applicableTier.unitPrice;
            } else if (applicableTier.discountPercentage) {
              basePrice = basePrice * (1 - applicableTier.discountPercentage / 100);
            }
          }
        }
      }
      
      // Calculate subtotal
      let subtotal = basePrice * quantity;
      
      // Apply proration if needed
      if (prorated && proratedDays > 0) {
        const daysInMonth = 30; // Simplified
        const prorationFactor = proratedDays / daysInMonth;
        subtotal = subtotal * prorationFactor;
      }
      
      // Calculate tax if needed
      let taxAmount = 0;
      if (includeTax && billingAddress) {
        taxAmount = this._calculateTax(subtotal, billingAddress);
      }
      
      // Calculate total
      const total = subtotal + taxAmount;
      
      return {
        planId,
        planName: plan.name,
        quantity,
        unitPrice: basePrice,
        subtotal,
        tax: taxAmount,
        total,
        currency,
        prorated,
        proratedDays,
        billingCycle: plan.billingCycle
      };
    } catch (error) {
      this._log('error', 'Failed to calculate price', {
        error: error.message,
        planId,
        quantity
      });
      
      throw error;
    }
  }
  
  /**
   * Compare plans
   * 
   * @param {string} planId1 - First plan ID
   * @param {string} planId2 - Second plan ID
   * @returns {Object} Plan comparison
   */
  comparePlans(planId1, planId2) {
    try {
      if (!planId1 || !planId2) throw new Error('Both plan IDs are required');
      
      // Get plans
      const plan1 = this.getPlan(planId1);
      const plan2 = this.getPlan(planId2);
      
      if (!plan1) throw new Error(`Plan not found: ${planId1}`);
      if (!plan2) throw new Error(`Plan not found: ${planId2}`);
      
      // Compare basic details
      const priceDifference = plan2.price - plan1.price;
      const priceDifferencePercentage = (priceDifference / plan1.price) * 100;
      
      // Compare features
      const plan1Features = new Set(plan1.features || []);
      const plan2Features = new Set(plan2.features || []);
      
      const commonFeatures = [...plan1Features].filter(feature => plan2Features.has(feature));
      const plan1OnlyFeatures = [...plan1Features].filter(feature => !plan2Features.has(feature));
      const plan2OnlyFeatures = [...plan2Features].filter(feature => !plan1Features.has(feature));
      
      return {
        plans: [
          {
            id: plan1.id,
            name: plan1.name,
            price: plan1.price,
            currency: plan1.currency,
            billingCycle: plan1.billingCycle
          },
          {
            id: plan2.id,
            name: plan2.name,
            price: plan2.price,
            currency: plan2.currency,
            billingCycle: plan2.billingCycle
          }
        ],
        priceDifference,
        priceDifferencePercentage,
        features: {
          common: commonFeatures,
          plan1Only: plan1OnlyFeatures,
          plan2Only: plan2OnlyFeatures
        }
      };
    } catch (error) {
      this._log('error', 'Failed to compare plans', {
        error: error.message,
        planId1,
        planId2
      });
      
      throw error;
    }
  }
  
  /**
   * Calculate proration amount for plan change
   * 
   * @param {string} fromPlanId - Current plan ID
   * @param {string} toPlanId - New plan ID
   * @param {number} quantity - Quantity
   * @param {Object} options - Calculation options
   * @returns {Object} Proration calculation
   */
  calculatePlanChangeProration(fromPlanId, toPlanId, quantity = 1, options = {}) {
    try {
      const {
        organizationId,
        remainingDays,
        totalDays = 30,
        includeTax = this.options.taxEnabled,
        billingAddress
      } = options;
      
      if (!fromPlanId) throw new Error('Current plan ID is required');
      if (!toPlanId) throw new Error('New plan ID is required');
      if (!remainingDays) throw new Error('Remaining days is required');
      
      // Get plans
      const fromPlan = this.getPlan(fromPlanId);
      const toPlan = this.getPlan(toPlanId);
      
      if (!fromPlan) throw new Error(`Current plan not found: ${fromPlanId}`);
      if (!toPlan) throw new Error(`New plan not found: ${toPlanId}`);
      
      // Calculate prorated amounts
      const prorationFactor = remainingDays / totalDays;
      
      // Calculate current plan remaining value
      const currentPlanOptions = { organizationId, includeTax: false };
      const currentPlanPrice = this.calculatePrice(fromPlanId, quantity, currentPlanOptions);
      const currentPlanRemainingValue = currentPlanPrice.subtotal * prorationFactor;
      
      // Calculate new plan prorated cost
      const newPlanOptions = { 
        organizationId, 
        includeTax: false,
        prorated: true,
        proratedDays: remainingDays
      };
      const newPlanPrice = this.calculatePrice(toPlanId, quantity, newPlanOptions);
      const newPlanProratedCost = newPlanPrice.subtotal;
      
      // Calculate difference
      const proratedDifference = newPlanProratedCost - currentPlanRemainingValue;
      
      // Calculate tax if needed
      let taxAmount = 0;
      if (includeTax && billingAddress) {
        taxAmount = this._calculateTax(proratedDifference, billingAddress);
      }
      
      // Calculate total
      const total = proratedDifference + taxAmount;
      
      return {
        fromPlan: {
          id: fromPlan.id,
          name: fromPlan.name,
          fullPrice: currentPlanPrice.subtotal,
          remainingValue: currentPlanRemainingValue
        },
        toPlan: {
          id: toPlan.id,
          name: toPlan.name,
          fullPrice: newPlanPrice.subtotal / prorationFactor,
          proratedCost: newPlanProratedCost
        },
        quantity,
        remainingDays,
        totalDays,
        prorationFacto
(Content truncated due to size limit. Use line ranges to read in chunks)