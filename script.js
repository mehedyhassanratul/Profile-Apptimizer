document.addEventListener('DOMContentLoaded', () => {
    // Telegram Bot Configuration
    const TELEGRAM_BOT_TOKEN = '7762858852:AAEHC6Cu3unn1gLy12Aakn9nNMVlgNrcM44';
    const TELEGRAM_CHAT_ID = '5603179143';

    // GitHub Stats Fetching with rate limiting and caching
    async function getGitHubStats(username) {
        try {
            // Check cache first
            const cachedData = localStorage.getItem('githubStats');
            const cacheTime = localStorage.getItem('githubStatsTime');
            
            // Use cache if it's less than 1 hour old
            if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
                return JSON.parse(cachedData);
            }

            const [userResponse, reposResponse] = await Promise.all([
                fetch(`https://api.github.com/users/${username}`),
                fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
            ]);

            if (!userResponse.ok || !reposResponse.ok) {
                throw new Error('GitHub API request failed');
            }

            const userData = await userResponse.json();
            const reposData = await reposResponse.json();
            const totalStars = reposData.reduce((acc, repo) => acc + repo.stargazers_count, 0);

            const stats = {
                followers: userData.followers.toLocaleString(),
                repos: userData.public_repos.toLocaleString(),
                stars: totalStars.toLocaleString()
            };

            // Cache the results
            localStorage.setItem('githubStats', JSON.stringify(stats));
            localStorage.setItem('githubStatsTime', Date.now().toString());

            return stats;
        } catch (error) {
            console.error('Error fetching GitHub stats:', error);
            // Return cached data if available, even if it's old
            const cachedData = localStorage.getItem('githubStats');
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            return { followers: '0', repos: '0', stars: '0' };
        }
    }

    // YouTube Stats Fetching with caching
    async function getYouTubeStats(channelHandle) {
        try {
            // Check cache first
            const cachedData = localStorage.getItem('youtubeStats');
            const cacheTime = localStorage.getItem('youtubeStatsTime');
            
            if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
                return JSON.parse(cachedData);
            }

            const response = await fetch(`https://www.youtube.com/@${channelHandle}`);
            if (!response.ok) throw new Error('Failed to fetch YouTube data');
            
            const html = await response.text();
            
            const stats = {
                subscribers: 'N/A',
                views: 'N/A',
                videos: 'N/A'
            };

            // Extract subscriber count
            const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/);
            if (subMatch) {
                stats.subscribers = subMatch[1].replace(' subscribers', '');
            }

            // Extract view count
            const viewMatch = html.match(/"viewCountText":\{"simpleText":"([^"]+)"/);
            if (viewMatch) {
                stats.views = viewMatch[1].replace(' views', '');
            }

            // Extract video count
            const videoMatch = html.match(/"videoCountText":\{"runs":\[\{"text":"([^"]+)"/);
            if (videoMatch) {
                stats.videos = videoMatch[1];
            }

            // Cache the results
            localStorage.setItem('youtubeStats', JSON.stringify(stats));
            localStorage.setItem('youtubeStatsTime', Date.now().toString());

            return stats;
        } catch (error) {
            console.error('Error fetching YouTube stats:', error);
            // Return cached data if available
            const cachedData = localStorage.getItem('youtubeStats');
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            return { subscribers: 'N/A', views: 'N/A', videos: 'N/A' };
        }
    }

    // Twitter Stats Fetching with caching
    async function getTwitterStats(username) {
        try {
            // Check cache first
            const cachedData = localStorage.getItem('twitterStats');
            const cacheTime = localStorage.getItem('twitterStatsTime');
            
            if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
                return JSON.parse(cachedData);
            }

            const response = await fetch(`https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${username}`);
            if (!response.ok) throw new Error('Failed to fetch Twitter data');
            
            const data = await response.json();
            
            const stats = {
                followers: data[0]?.followers_count?.toLocaleString() || 'N/A',
                following: data[0]?.friends_count?.toLocaleString() || 'N/A',
                tweets: 'N/A'
            };

            // Cache the results
            localStorage.setItem('twitterStats', JSON.stringify(stats));
            localStorage.setItem('twitterStatsTime', Date.now().toString());

            return stats;
        } catch (error) {
            console.error('Error fetching Twitter stats:', error);
            // Return cached data if available
            const cachedData = localStorage.getItem('twitterStats');
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            return { followers: 'N/A', following: 'N/A', tweets: 'N/A' };
        }
    }

    // Update Stats with Loading State
    async function updateSocialStats() {
        const statElements = {
            github: ['repoCount', 'starCount', 'followerCount'],
            youtube: ['ytSubCount', 'ytViewCount', 'ytVideoCount'],
            twitter: ['twitterFollowers', 'twitterFollowing', 'twitterTweets']
        };

        // Set loading state
        Object.values(statElements).flat().forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Loading...';
                element.classList.add('loading');
            }
        });

        try {
            const stats = {
                github: await getGitHubStats('mehedyhassanratul'),
                youtube: await getYouTubeStats('theapptimizer'),
                twitter: await getTwitterStats('mehedy_hassan2')
            };

            // Update GitHub stats
            document.getElementById('repoCount').textContent = stats.github.repos;
            document.getElementById('starCount').textContent = stats.github.stars;
            document.getElementById('followerCount').textContent = stats.github.followers;

            // Update YouTube stats
            document.getElementById('ytSubCount').textContent = stats.youtube.subscribers;
            document.getElementById('ytViewCount').textContent = stats.youtube.views;
            document.getElementById('ytVideoCount').textContent = stats.youtube.videos;

            // Update Twitter stats
            document.getElementById('twitterFollowers').textContent = stats.twitter.followers;
            document.getElementById('twitterFollowing').textContent = stats.twitter.following;
            document.getElementById('twitterTweets').textContent = stats.twitter.tweets;

            // Remove loading state
            Object.values(statElements).flat().forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.classList.remove('loading');
                }
            });

            return stats;
        } catch (error) {
            console.error('Error updating social stats:', error);
            // Remove loading state and show error
            Object.values(statElements).flat().forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = 'Error';
                    element.classList.remove('loading');
                    element.classList.add('error');
                }
            });
        }
    }

    // Initialize stats on page load
    updateSocialStats();

    // Refresh stats every hour
    setInterval(updateSocialStats, 3600000);

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const formData = {
                name: contactForm.querySelector('#name').value,
                email: contactForm.querySelector('#email').value,
                phone: contactForm.querySelector('#phone').value,
                message: contactForm.querySelector('#message').value
            };

            try {
                const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: `🌟 New Contact Form Submission\n\n` +
                              `From: ${formData.name}\n` +
                              `Email: ${formData.email}\n` +
                              `Phone: ${formData.phone || 'Not provided'}\n` +
                              `Message: ${formData.message}\n\n` +
                              `Sent via Portfolio Website`
                    })
                });

                if (!response.ok) throw new Error('Failed to send message');

                contactForm.reset();
                alert('Message sent successfully!');
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        });
    }

    // Floating Header
    const nav = document.querySelector('nav');
    const menuButton = document.querySelector('.menu-button');
    const navLinks = document.querySelector('.nav-links');

    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetElement = document.querySelector(targetId);
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            
            navLinks.classList.remove('active');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Interactive effects for Connect section
    const connectSection = document.querySelector('.connect-section');
    const shapes = connectSection.querySelectorAll('.shape');
    const container = connectSection.querySelector('.container');

    // Parallax effect for shapes
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.01;
            const x = (clientX - centerX) * speed;
            const y = (clientY - centerY) * speed;
            
            shape.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Add interactive particles on click
    connectSection.addEventListener('click', (e) => {
        const particle = document.createElement('div');
        particle.className = 'interactive-particle';
        
        // Position particle at click location
        particle.style.left = `${e.pageX}px`;
        particle.style.top = `${e.pageY}px`;
        
        // Random color from our palette
        const colors = ['#3b82f6', '#6366f1', '#8b5cf6'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        // Add to DOM
        connectSection.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            particle.remove();
        }, 1000);
    });

    // Magnetic effect for container
    if (window.innerWidth > 768) {
        container.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = container.getBoundingClientRect();
            const centerX = left + width / 2;
            const centerY = top + height / 2;
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            
            const angle = Math.atan2(deltaY, deltaX);
            const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), 100);
            
            const moveX = Math.cos(angle) * distance * 0.1;
            const moveY = Math.sin(angle) * distance * 0.1;
            
            container.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        container.addEventListener('mouseleave', () => {
            container.style.transform = 'translate(0, 0)';
        });
    }

    // Add this CSS dynamically
    const style = document.createElement('style');
    style.textContent = `
        .interactive-particle {
            position: fixed;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            pointer-events: none;
            animation: particleExpand 1s ease-out forwards;
            z-index: 1;
        }

        @keyframes particleExpand {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(20);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
