import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const blogs = [
    {
      title: "5 Hidden Gems in Manali You Must Visit",
      slug: "hidden-gems-manali",
      excerpt: "Beyond the crowded streets of Mall Road lie some of Manali's most serene and breathtaking secrets. From hidden waterfalls to ancient villages, discover the side of Manali most tourists never see.",
      content: `
        <h2>1. Jogini Waterfalls</h2>
        <p>A short trek from Vashisht Temple leads you to the magnificent Jogini Falls. It's not just a waterfall; it's a spiritual experience where the water cascades down from over 150 feet. The mist from the falls and the verdant surroundings make it a perfect spot for meditation or a quiet picnic.</p>
        <img src="https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&q=80&w=1000" alt="Jogini Waterfalls" />
        
        <h2>2. Old Manali's Charm</h2>
        <p>While the new town is bustling, Old Manali retains an old-world charm with its wooden houses, quaint cafes, and the sound of the Beas river ever-present in the background. It's the soul of Manali, where tradition meets a bohemian vibe.</p>
        
        <blockquote>"In Manali, every corner tells a story of the mountains and the people who call them home. You just need to listen."</blockquote>
        
        <h2>3. Sajanu Ville & Simsa</h2>
        <p>For those seeking peace, the area around Simsa offer panoramic views of the entire valley without the noise of the city center. The apple orchards here are particularly beautiful during the spring bloom.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=1000",
      category: "Travel Guide",
      author: "Himachal Expert"
    },
    {
      title: "The Ultimate Guide to Rohtang Pass Adventures",
      slug: "rohtang-pass-guide",
      excerpt: "Everything you need to know about visiting the legendary Rohtang Pass. From permits and timings to the best activities like skiing and paragliding at 13,000 feet.",
      content: `
        <h2>The Gateway to Lahaul and Spiti</h2>
        <p>Rohtang Pass is more than just a destination; it's the gateway to the tribal valleys of Himachal. Situated at 13,050 feet, it offers snow even in peak summer. The drive itself is an adventure, with winding roads and dramatic mountain vistas.</p>
        <img src="https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=1000" alt="Rohtang Pass Snow" />
        
        <h2>Things to Do</h2>
        <p>Whether you're an adrenaline junkie or a nature lover, Rohtang has something for everyone:</p>
        <ul>
          <li><strong>Skiing and Snowboarding:</strong> Professional instructors are available for beginners.</li>
          <li><strong>Sledge Rides:</strong> A fun way to navigate the snowy slopes.</li>
          <li><strong>Photo sessions:</strong> Rent traditional Himachali attire for that perfect mountain memory.</li>
        </ul>
        
        <h2>Pro Tip for Travelers</h2>
        <p>Always check for permit availability at least 2 days in advance as they are limited following NGT guidelines. Also, carry heavy woolens even if it's warm in Manali town!</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=1000",
      category: "Adventure",
      author: "Avasa Concierge"
    },
    {
      title: "Traditional Himachali Cuisine: A Gourmet Journey",
      slug: "himachali-cuisine",
      excerpt: "Discover the rich flavors of 'Dham' and other traditional dishes that make Manali a food lover's paradise. Experience the authentic taste of the mountains.",
      content: `
        <h2>What is Dham?</h2>
        <p>Dham is a traditional feast prepared by specialized chefs called 'Boti'. It consists of rice, madra (curd-based curry), and various pulses cooked in traditional brass vessels called 'Charoti'. It's not just a meal; it's a celebration of Himalayan culture.</p>
        <img src="https://images.unsplash.com/photo-1589187151053-5ec8818e661b?auto=format&fit=crop&q=80&w=1000" alt="Traditional Dham" />
        
        <h2>Local Delicacies to Try</h2>
        <p>Don't leave Manali without trying <strong>Siddu</strong> with hot ghee—a steamed bread filled with walnuts and spices. For seafood lovers, the <strong>Kullu Trout</strong>, freshly caught and expertly grilled, is a world-class delicacy.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000",
      category: "Food & Culture",
      author: "Chef Avasa"
    },
    {
      title: "Winter Magic: Why Manali is India's Best Snow Destination",
      slug: "winter-magic-manali",
      excerpt: "When the first snowflakes fall, Manali transforms into a magical white wonderland. Explore the best spots for snow lovers and winter sports enthusiasts.",
      content: `
        <h2>The White Transformation</h2>
        <p>Winter in Manali (December to February) is a surreal experience. From the frozen waterfalls of Solang Valley to the snow-laden deodar trees of Hadimba forest, every frame looks like a postcard from a dream.</p>
        <img src="https://images.unsplash.com/photo-1549488497-23686236e78a?auto=format&fit=crop&q=80&w=1000" alt="Winter Manali" />
        
        <h2>Best Snow Spots</h2>
        <ul>
          <li><strong>Solang Valley:</strong> The hub for skiing, paragliding, and zorbing.</li>
          <li><strong>Gulaba:</strong> Perfect for a quieter snow experience when Rohtang is closed.</li>
          <li><strong>Mall Road:</strong> Enjoy hot maggi and tea while watching the snowfall in the town center.</li>
        </ul>
        
        <blockquote>"Snowflakes are the flowers of a mountain winter. Manali is the grandest garden of them all."</blockquote>
      `,
      imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000",
      category: "Resort News",
      author: "Avasa Editorial"
    },
    {
      title: "Trekking in Manali: From Beas Kund to Bhrigu Lake",
      slug: "trekking-guide-manali",
      excerpt: "Lace up your boots for the adventure of a lifetime. A comprehensive guide to the most rewarding treks around Manali for every fitness level.",
      content: `
        <h2>Beas Kund: The Source of the River</h2>
        <p>This beginner-friendly trek takes you to the pristine glacial lake where the Beas River originates. You'll walk through lush meadows and get up close with peaks like Hanuman Tibba and Seven Sisters.</p>
        <img src="https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&q=80&w=1000" alt="Trekking in Manali" />
        
        <h2>Bhrigu Lake: The High Altitude Meadow</h2>
        <p>Located at over 14,000 feet, this trek is famous for its alpine meadows that rival those of Switzerland. Legend says the sage Bhrigu meditated here, and the lake remains frozen for most of the year.</p>
        
        <h2>Safety First</h2>
        <p>Always hire a local guide, carry enough water, and ensure you are acclimatized to the altitude before heading out on high-altitude treks.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1502126324834-38f8e02d7160?auto=format&fit=crop&q=80&w=1000",
      category: "Travel Guide",
      author: "Adventure Guide"
    }
  ];

  for (const b of blogs) {
    await prisma.websiteBlog.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
  }




  console.log('Successfully created 5 professional Manali blogs!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { };
