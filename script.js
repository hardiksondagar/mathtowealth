// Math To Wealth - Landing Page Scripts

document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active class to project cards on hover
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            projectCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Add year to copyright text
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Responsive navigation menu for mobile
    const menuToggle = document.createElement('button');
    menuToggle.classList.add('md:hidden', 'ml-auto', 'text-gray-600', 'hover:text-indigo-600');
    menuToggle.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
    
    const nav = document.querySelector('nav');
    const header = document.querySelector('header .container');
    
    if (header && nav) {
        // Only add mobile menu in small screens
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        function handleScreenChange(e) {
            if (e.matches) {
                // Add toggle button if not already present
                if (!document.querySelector('button.md\\:hidden')) {
                    header.appendChild(menuToggle);
                    nav.classList.add('hidden');
                }
                
                // Add toggle functionality
                menuToggle.addEventListener('click', function() {
                    nav.classList.toggle('hidden');
                    nav.classList.toggle('block');
                    nav.classList.toggle('absolute');
                    nav.classList.toggle('top-16');
                    nav.classList.toggle('right-4');
                    nav.classList.toggle('bg-white');
                    nav.classList.toggle('p-4');
                    nav.classList.toggle('rounded');
                    nav.classList.toggle('shadow-lg');
                    nav.classList.toggle('z-50');
                });
            } else {
                // Remove mobile menu elements in larger screens
                if (document.querySelector('button.md\\:hidden')) {
                    menuToggle.remove();
                    nav.classList.remove('hidden');
                }
            }
        }
        
        mediaQuery.addEventListener('change', handleScreenChange);
        handleScreenChange(mediaQuery);
    }

    // Add subtle parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const heroSection = document.querySelector('main section:first-child');
        
        if (heroSection) {
            heroSection.style.backgroundPositionY = scrollPosition * 0.05 + 'px';
        }
    });
}); 