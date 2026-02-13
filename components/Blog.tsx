import React, { memo } from 'react';
import { SectionId } from '../types';
import { BLOG_POSTS } from '../constants';
import { Calendar, ArrowRight } from 'lucide-react';

const BlogCard = memo(({ post }: { post: typeof BLOG_POSTS[0] }) => (
  <div className="min-w-[280px] snap-center group cursor-pointer">
    <div className="relative h-48 rounded-xl overflow-hidden mb-6 shadow-md">
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute top-4 left-4 bg-brand-terracotta text-white text-[10px] font-bold uppercase px-2 py-1 rounded">
        {post.category}
      </div>
    </div>

    <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-3">
      <Calendar size={12} /> {post.date}
    </div>

    <h3 className="text-xl font-display text-brand-charcoal mb-3 leading-tight group-hover:text-brand-terracotta transition-colors duration-200">
      {post.title}
    </h3>

    <p className="text-gray-600 text-sm font-light leading-relaxed line-clamp-2">
      {post.excerpt}
    </p>
  </div>
));

BlogCard.displayName = 'BlogCard';

const Blog: React.FC = () => {
  return (
    <section id={SectionId.BLOG} className="py-24 bg-brand-cream relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-void to-transparent opacity-10" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-brand-terracotta text-xs font-bold uppercase tracking-[0.3em] mb-2 block">Market Intelligence</span>
            <h2 className="text-3xl md:text-4xl font-display text-brand-charcoal">News & <span className="italic font-serif">Insights</span></h2>
          </div>
          <button className="hidden md:flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-brand-charcoal hover:text-brand-terracotta transition-colors duration-200">
            View Archive <ArrowRight size={14} />
          </button>
        </div>

        {/* Horizontal Scroll for Mobile */}
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory no-scrollbar -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible">
          {BLOG_POSTS.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        <div className="md:hidden mt-4 text-center">
          <button className="text-xs uppercase font-bold tracking-widest text-brand-charcoal border-b border-brand-charcoal pb-1">
            Read More News
          </button>
        </div>
      </div>
    </section>
  );
};

export default memo(Blog);
