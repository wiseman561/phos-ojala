// This file contains interactive demo functionality for the Ojalá Healthcare Platform mockups
// It adds simulated interactions to make the mockups feel more like a real application

// Common functionality for all mockups
function initializeCommonFunctionality() {
  // Add click handlers to all buttons
  document.querySelectorAll('button, .btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      highlightElement(this);
    });
  });

  // Add click handlers to all links
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      highlightElement(this);
    });
  });

  // Add hover effects to interactive elements
  document.querySelectorAll('button, .btn, a, .card, .sidebar-item').forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s';
      this.style.transform = 'scale(1.02)';
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.transition = 'all 0.3s';
      this.style.transform = 'scale(1)';
    });
  });
}

// Highlight an element when clicked to provide visual feedback
function highlightElement(element) {
  const originalBackground = element.style.backgroundColor;
  const originalTransform = element.style.transform;
  
  element.style.backgroundColor = 'rgba(45, 91, 255, 0.1)';
  element.style.transform = 'scale(1.05)';
  
  setTimeout(() => {
    element.style.backgroundColor = originalBackground;
    element.style.transform = originalTransform;
  }, 300);
}

// Patient App specific functionality
function initializePatientApp() {
  // Simulate health score animation
  const healthScoreElement = document.querySelector('.health-score-value');
  if (healthScoreElement) {
    const targetScore = parseInt(healthScoreElement.textContent);
    animateCounter(healthScoreElement, 0, targetScore, 1500);
  }
  
  // Add tab switching functionality
  const tabs = document.querySelectorAll('.nav-link');
  const tabContents = document.querySelectorAll('.tab-pane');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active', 'show'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Show corresponding content
      const target = this.getAttribute('href').substring(1);
      document.getElementById(target).classList.add('active', 'show');
    });
  });
  
  // Simulate vitals data updates
  simulateVitalsUpdates();
}

// RN Dashboard specific functionality
function initializeRNDashboard() {
  // Simulate patient list filtering
  const searchInput = document.querySelector('.search-input');
  const patientCards = document.querySelectorAll('.patient-card');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      
      patientCards.forEach(card => {
        const patientName = card.querySelector('.patient-name').textContent.toLowerCase();
        
        if (patientName.includes(searchTerm)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
  
  // Add patient card selection
  patientCards.forEach(card => {
    card.addEventListener('click', function() {
      patientCards.forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      
      // Simulate loading patient details
      const patientDetailsSection = document.querySelector('.patient-details-section');
      if (patientDetailsSection) {
        patientDetailsSection.style.opacity = '0.5';
        setTimeout(() => {
          patientDetailsSection.style.opacity = '1';
        }, 500);
      }
    });
  });
  
  // Simulate alert handling
  const alertItems = document.querySelectorAll('.alert-item');
  alertItems.forEach(alert => {
    const resolveBtn = alert.querySelector('.resolve-btn');
    if (resolveBtn) {
      resolveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        alert.style.opacity = '0.5';
        alert.style.textDecoration = 'line-through';
        
        // Update alert counter
        const alertCounter = document.querySelector('.alert-counter');
        if (alertCounter) {
          const currentCount = parseInt(alertCounter.textContent);
          alertCounter.textContent = currentCount - 1;
        }
      });
    }
  });
}

// Employer Dashboard specific functionality
function initializeEmployerDashboard() {
  // Add department row hover effect
  const departmentRows = document.querySelectorAll('.department-row');
  departmentRows.forEach(row => {
    row.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(45, 91, 255, 0.05)';
    });
    
    row.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '';
    });
  });
  
  // Add program card selection
  const programCards = document.querySelectorAll('.program-card');
  programCards.forEach(card => {
    card.addEventListener('click', function() {
      programCards.forEach(c => c.style.transform = '');
      this.style.transform = 'translateY(-10px)';
    });
  });
  
  // Simulate date filter functionality
  const dateFilter = document.querySelector('.date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('click', function() {
      this.classList.toggle('active');
      if (this.classList.contains('active')) {
        this.style.backgroundColor = 'rgba(45, 91, 255, 0.1)';
      } else {
        this.style.backgroundColor = '';
      }
    });
  }
}

// Helper function to animate counters
function animateCounter(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = Math.floor(progress * (end - start) + start);
    element.textContent = currentValue;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Simulate vitals data updates
function simulateVitalsUpdates() {
  const heartRateValue = document.querySelector('.heart-rate-value');
  const glucoseValue = document.querySelector('.glucose-value');
  const bpValue = document.querySelector('.bp-value');
  
  if (heartRateValue && glucoseValue && bpValue) {
    // Update heart rate randomly every 3 seconds
    setInterval(() => {
      const newHeartRate = 72 + Math.floor(Math.random() * 5);
      heartRateValue.textContent = newHeartRate;
    }, 3000);
    
    // Update glucose value randomly every 5 seconds
    setInterval(() => {
      const newGlucose = 105 + Math.floor(Math.random() * 8);
      glucoseValue.textContent = newGlucose;
    }, 5000);
    
    // Update blood pressure randomly every 7 seconds
    setInterval(() => {
      const systolic = 120 + Math.floor(Math.random() * 5);
      const diastolic = 80 + Math.floor(Math.random() * 3);
      bpValue.textContent = `${systolic}/${diastolic}`;
    }, 7000);
  }
}

// Initialize appropriate functionality based on the current page
document.addEventListener('DOMContentLoaded', function() {
  initializeCommonFunctionality();
  
  // Determine which page we're on and initialize specific functionality
  if (document.querySelector('.patient-app')) {
    initializePatientApp();
  } else if (document.querySelector('.rn-dashboard')) {
    initializeRNDashboard();
  } else if (document.querySelector('.employer-dashboard')) {
    initializeEmployerDashboard();
  }
  
  console.log('Interactive demo elements initialized');
});
