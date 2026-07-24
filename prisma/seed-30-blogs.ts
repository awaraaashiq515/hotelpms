import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
const prisma = new PrismaClient();

async function main() {
  const blogs = [
    {
      title: "How to Choose the Best POS for Your Restaurant",
      slug: "choose-best-pos-restaurant",
      excerpt: "Finding the right Point of Sale (POS) system can make or break your restaurant's efficiency. Learn the key features to look for in 2026.",
      content: `
        <h2>The Heart of Your Restaurant Operations</h2>
        <p>A modern POS system is much more than just a cash register. It's the hub where your front-of-house, kitchen, and management meet. In this guide, we explore how to evaluate features like cloud synchronization, offline reliability, and intuitive design.</p>
        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000" alt="Modern POS System" />
        
        <h3>Key Features to Consider:</h3>
        <ul>
          <li><strong>Cloud Integration:</strong> Access your data from anywhere, anytime.</li>
          <li><strong>Inventory Management:</strong> Track stock in real-time to prevent wastage.</li>
          <li><strong>User Interface:</strong> Ensure your staff can learn the system in minutes, not days.</li>
        </ul>
        
        <blockquote>"The best POS is the one that stays out of the way and lets you focus on your guests."</blockquote>
        
        <p>At OrderMint, we've designed our system to be the most intuitive and powerful solution for restaurants of all sizes.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "OrderMint Team"
    },
    {
      title: "The Future of Cloud-Based Inventory Management",
      slug: "future-cloud-inventory-management",
      excerpt: "Say goodbye to spreadsheets. Discover how cloud-based inventory tracking is revolutionizing restaurant procurement and waste reduction.",
      content: `
        <h2>Real-Time Tracking is No Longer Optional</h2>
        <p>Managing inventory used to be a manual, error-prone task. With cloud-based solutions, every sale automatically updates your stock levels, providing instant insights into what's selling and what's sitting.</p>
        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" alt="Inventory Management" />
        
        <h3>Benefits of Cloud Inventory:</h3>
        <ul>
          <li><strong>Automated Reordering:</strong> Never run out of your best-selling ingredients.</li>
          <li><strong>Waste Analysis:</strong> Identify patterns and reduce food costs.</li>
          <li><strong>Multi-Location Sync:</strong> Manage multiple outlets seamlessly.</li>
        </ul>
      `,
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000",
      category: "Product Updates",
      author: "Inventory Expert"
    },
    {
      title: "Increasing Table Turnover with Mobile Ordering",
      slug: "increase-table-turnover-mobile-ordering",
      excerpt: "Learn how mobile ordering and digital menus can speed up service and increase your daily revenue without stressing your staff.",
      content: `
        <h2>Efficiency in Every Order</h2>
        <p>Mobile ordering allows guests to browse and order directly from their devices, reducing the time spent waiting for a server. This leads to faster service and quicker table turnover.</p>
        <img src="https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=1000" alt="Mobile Ordering" />
        
        <h3>Why Mobile Ordering Works:</h3>
        <p>By digitizing the ordering process, you eliminate errors and give your servers more time to focus on high-quality guest interactions.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Service Pro"
    },
    {
      title: "Why Your Restaurant Needs a Digital Menu",
      slug: "why-restaurant-needs-digital-menu",
      excerpt: "Digital menus are more than just a COVID-era trend. They offer dynamic pricing, instant updates, and a superior guest experience.",
      content: `
        <h2>The End of Printed Menus?</h2>
        <p>Updating a printed menu is expensive and slow. Digital menus allow you to change prices, add seasonal specials, and mark items as out of stock instantly.</p>
        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000" alt="Digital Menu" />
      `,
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Digital Strategist"
    },
    {
      title: "Optimizing Kitchen Operations with KOT Systems",
      slug: "optimize-kitchen-kot-systems",
      excerpt: "Kitchen Order Tickets (KOT) are the backbone of a busy kitchen. See how digital KOTs improve communication and reduce order errors.",
      content: `
        <h2>From POS to Kitchen Instantly</h2>
        <p>Digital KOT systems eliminate the need for paper tickets and ensure that the kitchen receives orders exactly as the guest intended.</p>
        <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000" alt="Kitchen Operations" />
      `,
      imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000",
      category: "Product Updates",
      author: "Head Chef"
    },
    {
      title: "Customer Loyalty Programs That Actually Work",
      slug: "customer-loyalty-programs-work",
      excerpt: "Building a loyal customer base is easier than ever with integrated POS loyalty features. Learn how to keep your guests coming back.",
      content: `
        <h2>Retention is the New Acquisition</h2>
        <p>It costs much less to keep an existing customer than to find a new one. Learn how to create rewards that resonate with your diners.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Marketing Guru"
    },
    {
      title: "The Importance of Data Analytics in F&B",
      slug: "importance-data-analytics-fb",
      excerpt: "Your POS data is a goldmine. Discover how to use sales reports and customer trends to make smarter business decisions.",
      content: `
        <h2>Data-Driven Decisions</h2>
        <p>Stop guessing and start knowing. Analyze your peak hours, most profitable items, and server performance with OrderMint's deep analytics.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Data Scientist"
    },
    {
      title: "Managing Multiple Restaurant Outlets from One Dashboard",
      slug: "manage-multiple-outlets-dashboard",
      excerpt: "Scaling your restaurant business? Learn how to manage 10 locations as easily as one with centralized POS management.",
      content: `
        <h2>Scaling Without the Stress</h2>
        <p>Centralized management allows you to update menus across all locations and view consolidated reports with a single click.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
      category: "Product Updates",
      author: "Operations Manager"
    },
    {
      title: "Integrating Payments: UPI, Cards, and More",
      slug: "integrating-payments-upi-cards",
      excerpt: "Seamless payments lead to happy customers. Explore the latest payment integrations for Indian restaurants, from UPI to Tap-to-Pay.",
      content: `
        <h2>Frictionless Checkout</h2>
        <p>In today's digital world, offering multiple payment options is a must. Integrate UPI, credit cards, and digital wallets directly into your billing process.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Fintech Expert"
    },
    {
      title: "How to Reduce Food Waste Using Inventory Tracking",
      slug: "reduce-food-waste-inventory-tracking",
      excerpt: "Food waste is a major cost for restaurants. Learn how precise inventory tracking can help you save money and the environment.",
      content: `
        <h2>Sustainability Meets Profitability</h2>
        <p>By tracking expiration dates and stock movements, you can significantly reduce the amount of food that ends up in the bin.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1532634896-26909d0d4b89?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Eco Specialist"
    },
    {
      title: "Staff Management Tips for Busy Restaurants",
      slug: "staff-management-tips-busy-restaurants",
      excerpt: "High turnover and peak hour stress can be managed. Discover staff scheduling and performance tracking tips.",
      content: `
        <h2>Empower Your Team</h2>
        <p>A well-managed team is a happy team. Use POS data to reward your best performers and identify areas for training.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "HR Manager"
    },
    {
      title: "The Impact of Online Ordering on Dine-In Business",
      slug: "impact-online-ordering-dine-in",
      excerpt: "Online ordering isn't just for delivery. See how it's changing the dine-in landscape and how you can adapt.",
      content: `
        <h2>The New Hybrid Model</h2>
        <p>Restaurants that embrace both online and offline ordering are seeing higher overall growth and better customer resilience.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1526367790999-0150786486a9?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Business Analyst"
    },
    {
      title: "Security Best Practices for POS Systems",
      slug: "security-best-practices-pos-systems",
      excerpt: "Protect your customer data and your revenue. Learn the essential security steps for any modern restaurant POS.",
      content: `
        <h2>Data Security is Paramount</h2>
        <p>From encrypted payments to user permissions, ensure your system is protected against internal and external threats.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Security Architect"
    },
    {
      title: "Trends in Restaurant Technology for 2026",
      slug: "trends-restaurant-technology-2026",
      excerpt: "What's next for the F&B industry? From AI-driven menus to robotics, explore the tech trends of tomorrow.",
      content: `
        <h2>The Future is Here</h2>
        <p>AI is beginning to play a massive role in predictive ordering and personalized guest experiences. Are you ready?</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Futurist"
    },
    {
      title: "How to Handle Peak Hour Rush Like a Pro",
      slug: "handle-peak-hour-rush-pro",
      excerpt: "The lunch rush doesn't have to be chaotic. Learn systems and processes to stay calm and efficient when it's busy.",
      content: `
        <h2>Chaos to Coordination</h2>
        <p>Proper preparation and the right technology can turn a stressful rush into a well-oiled machine.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Hospitality Veteran"
    },
    {
      title: "The Benefits of a Unified Billing System",
      slug: "benefits-unified-billing-system",
      excerpt: "Consolidate your dine-in, takeaway, and delivery orders into one single billing interface for better clarity.",
      content: `
        <h2>One Screen, All Orders</h2>
        <p>Avoid the confusion of multiple tablets. A unified system brings everything together for easier management.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000",
      category: "Product Updates",
      author: "Product Lead"
    },
    {
      title: "Enhancing Guest Experience with Personalized Service",
      slug: "enhancing-guest-experience-personalized-service",
      excerpt: "Use your POS guest data to remember favorites and allergies, creating a truly personal dining experience.",
      content: `
        <h2>Make Every Guest Feel Like a VIP</h2>
        <p>Knowing your customer's name and their favorite dish can turn a one-time visitor into a lifelong regular.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "CX Specialist"
    },
    {
      title: "Understanding GST Filing for Restaurants",
      slug: "understanding-gst-filing-restaurants",
      excerpt: "Tax compliance made easy. Learn how a POS can automate your GST reports and simplify your accounting.",
      content: `
        <h2>Tax Season Doesn't Have to be Scary</h2>
        <p>OrderMint automatically categorizes your taxes, making filing GST returns a breeze for you or your accountant.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Chartered Accountant"
    },
    {
      title: "Marketing Your Restaurant in the Digital Age",
      slug: "marketing-restaurant-digital-age",
      excerpt: "From Instagram to Google My Business, learn how to get more eyes on your restaurant online.",
      content: `
        <h2>Be Where Your Customers Are</h2>
        <p>Digital marketing is essential. Learn how to use professional photos and social media to drive foot traffic.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c267?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Growth Hacker"
    },
    {
      title: "Choosing the Right Thermal Printer for Your POS",
      slug: "choosing-right-thermal-printer-pos",
      excerpt: "Don't let a slow printer bottleneck your service. Learn about 80mm vs 58mm and Bluetooth vs LAN options.",
      content: `
        <h2>The Silent Workhorse</h2>
        <p>Choosing the right printer is critical for fast billing and clear KOTs. We compare the top models for 2026.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1582133611902-774d179659aa?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Hardware Specialist"
    },
    {
      title: "Offline vs Online POS: Which is Better?",
      slug: "offline-vs-online-pos-better",
      excerpt: "Internet issues can kill your business. Learn why a hybrid POS that works offline is the safest choice.",
      content: `
        <h2>Connectivity Should Never Stop Business</h2>
        <p>A true hybrid POS gives you the best of both worlds: cloud convenience and offline reliability.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Tech Consultant"
    },
    {
      title: "The Role of AI in Restaurant Management",
      slug: "role-ai-restaurant-management",
      excerpt: "Predictive analytics and automated scheduling are just the beginning. See how AI is making restaurants smarter.",
      content: `
        <h2>AI: Your New Sous Chef</h2>
        <p>From predicting how many burgers you'll sell on a Tuesday to optimizing staff shifts, AI is the ultimate assistant.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "AI Expert"
    },
    {
      title: "Streamlining Procurement with Vendor Management",
      slug: "streamlining-procurement-vendor-management",
      excerpt: "Keep your suppliers happy and your costs low with integrated vendor management and purchase orders.",
      content: `
        <h2>Better Relationships, Better Prices</h2>
        <p>Track your purchases and payments to vendors in one place to ensure you're always getting the best deal.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=1000",
      category: "Product Updates",
      author: "Supply Chain Manager"
    },
    {
      title: "Boosting Revenue with Upselling Techniques",
      slug: "boosting-revenue-upselling-techniques",
      excerpt: "Train your staff and use your digital menu to suggest pairings and add-ons that increase your average ticket size.",
      content: `
        <h2>The Art of the Add-On</h2>
        <p>A simple suggestion can increase your revenue significantly. Learn how to implement upselling without being pushy.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Sales Trainer"
    },
    {
      title: "Design Tips for an Efficient Restaurant Floor Plan",
      slug: "design-tips-efficient-restaurant-floor-plan",
      excerpt: "Layout matters. See how to design your restaurant for maximum flow, comfort, and server efficiency.",
      content: `
        <h2>Form Follows Function</h2>
        <p>A great floor plan improves guest experience and speeds up service. We look at the best layouts for various concepts.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Interior Designer"
    },
    {
      title: "The Importance of Real-Time Reporting",
      slug: "importance-real-time-reporting",
      excerpt: "Don't wait until the end of the month to see how you're doing. Track your sales and expenses as they happen.",
      content: `
        <h2>Pulse of Your Business</h2>
        <p>Real-time reporting gives you the power to react quickly to trends and issues throughout the day.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
      category: "Product Updates",
      author: "Business Owner"
    },
    {
      title: "How to Train Your Staff on a New POS",
      slug: "how-to-train-staff-new-pos",
      excerpt: "Switching systems can be scary. Learn how to onboard your team quickly and minimize disruption.",
      content: `
        <h2>Smooth Transitions</h2>
        <p>A structured training approach ensures that your staff feels confident and ready on day one of the new system.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Onboarding Specialist"
    },
    {
      title: "Managing Customer Feedback and Reviews",
      slug: "managing-customer-feedback-reviews",
      excerpt: "Every review is an opportunity. Learn how to handle negative feedback and amplify positive reviews.",
      content: `
        <h2>Listen to Your Diners</h2>
        <p>Feedback is the breakfast of champions. Use it to constantly improve your food and service.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Reputation Manager"
    },
    {
      title: "Eco-Friendly Practices for Modern Restaurants",
      slug: "eco-friendly-practices-modern-restaurants",
      excerpt: "Go green and save green. Explore sustainable practices that can reduce your footprint and attract conscious diners.",
      content: `
        <h2>Profit for People and Planet</h2>
        <p>From digital receipts to local sourcing, there are many ways to make your restaurant more sustainable.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000",
      category: "Guides",
      author: "Sustainability Advocate"
    },
    {
      title: "Scaling Your Restaurant Business: A Step-by-Step Guide",
      slug: "scaling-restaurant-business-step-step",
      excerpt: "Ready to open your second, third, or tenth location? Here's the roadmap to successful expansion.",
      content: `
        <h2>Growth Mindset</h2>
        <p>Scaling requires standardized processes and robust technology. Learn how to replicate your success.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1000",
      category: "Industry Insights",
      author: "Entrepreneur"
    }
  ];

  for (const b of blogs) {
    await prisma.websiteBlog.upsert({
      where: { slug: b.slug },
      update: {
        ...b,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        ...b,
        updatedAt: new Date(),
      },
    });
  }

  console.log(`Successfully created/updated ${blogs.length} professional OrderMint blogs!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};
