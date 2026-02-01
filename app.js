/**
 * Happy & Healthy Pets - Main JavaScript
 * Cart functionality and interactions
 */

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update cart count in navbar
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count, #cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    cartCountElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';

        // Add pop animation
        el.classList.remove('pop');
        void el.offsetWidth; // Trigger reflow
        el.classList.add('pop');
    });

    // Animate cart button
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.classList.remove('bounce');
        void cartBtn.offsetWidth;
        cartBtn.classList.add('bounce');
    }
}

// Add item to cart
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Show toast notification
    showToast('success', '¡Agregado!', `${name} se añadió al carrito`);
}

// Remove item from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update item quantity
function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            removeFromCart(id);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        }
    }
}

// Clear cart
function clearCart() {
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
}

// Get cart total
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

// Toast Notification System
function showToast(type, title, message) {
    // Create container if doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : 'ℹ️'}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = 'var(--shadow-sm)';
    }

    lastScroll = currentScroll;
});

// Scroll Reveal Animation
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// FAQ Accordion Functionality
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
    // Update cart count on load
    updateCartCount();

    // Initialize FAQ
    initFAQ();

    // Initialize scroll reveal for elements
    document.querySelectorAll('.benefit-card, .product-card, .testimonial-card, .faq-item').forEach((el, index) => {
        el.classList.add('reveal');
        if (index < 6) {
            el.classList.add(`stagger-${(index % 6) + 1}`);
        }
        revealObserver.observe(el);
    });

    // Reveal section headers
    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });

    // Handle broken images with fallback
    document.querySelectorAll('.product-image img').forEach(img => {
        img.onerror = function () {
            this.style.opacity = '0';
            this.parentElement.classList.add('image-error');
        };

        if (img.complete && img.naturalHeight === 0) {
            img.style.opacity = '0';
            img.parentElement.classList.add('image-error');
        }
    });

    // Enhanced add-to-cart button feedback
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', function (e) {
            this.style.transform = 'scale(0.85) rotate(180deg)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);

            this.classList.add('added');
            setTimeout(() => {
                this.classList.remove('added');
            }, 1000);
        });
    });
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'white';
            navLinks.style.flexDirection = 'column';
            navLinks.style.padding = '20px';
            navLinks.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
        });
    }
});

console.log('🐾 Happy & Healthy Pets - Funnel loaded successfully!');

