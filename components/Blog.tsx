import React, { memo } from 'react';
import { SectionId } from '../types';
import { BLOG_POSTS } from '../constants';
import { Calendar, ArrowRight } from 'lucide-react';

const BlogCard = memo(({ post }: { post: typeof BLOG_POSTS[0] }) => (
  <div
    className="min-w-[260px] w-[260px] md:w-auto md:min-w-0 snap-center group cursor-pointer
               transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
               active:scale-[0.98]"
  >
    <div
      className="relative h-44 md:h-48 rounded-ios-xl overflow-hidden mb-4 md:mb-6
                 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]
                 dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.4)]
                 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.12)]
                 group-active:scale-[0.98]"
    >
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-brand-terracotta text-white ios-caption-2 font-bold uppercase px-2 py-1 rounded-ios-sm">
        {post.category}
      </div>
      {/* Touch feedback overlay */}
      <div className="absolute inset-0 bg-black/0 active:bg-black/10 transition-colors duration-150 pointer-events-none md:hidden" />
    </div>

    <div className="flex items-center gap-2 text-gray-500 ios-caption-2 uppercase font-bold tracking-widest mb-2 md:mb-3">
      <Calendar size={12} /> {post.date}
    </div>

    <h3 className="ios-headline md:text-xl font-display text-brand-charcoal mb-2 md:mb-3 leading-tight group-hover:text-brand-terracotta transition-colors duration-200">
      {post.title}
    </h3>

    <p className="text-gray-600 ios-subheadline font-light leading-relaxed line-clamp-2">
      {post.excerpt}
    </p>
  </div>
));

BlogCard.displayName = 'BlogCard';

const Blog: React.FC = () => {
  return (
    <section id={SectionId.BLOG} className="py-16 md:py-24 bg-brand-cream relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-void to-transparent opacity-10" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex justify-between items-end mb-8 md:mb-12">
          <div>
            <span className="text-brand-terracotta ios-caption font-bold uppercase tracking-[0.3em] mb-2 block">Market Intelligence</span>
            <h2 className="ios-large-title md:text-4xl font-display text-brand-charcoal">News & <span className="italic font-serif">Insights</span></h2>
          </div>
          <button
            className="hidden md:flex items-center gap-2 ios-caption uppercase font-bold tracking-widest text-brand-charcoal
                       hover:text-brand-terracotta transition-colors duration-200
                       active:scale-[0.98] touch-target"
          >
            View Archive <ArrowRight size={14} />
          </button>
        </div>

        {/* Horizontal Scroll for Mobile with iOS-style snap scrolling */}
        <div
          className="flex overflow-x-auto gap-4 md:gap-6 pb-6 md:pb-8
                     snap-x snap-mandatory scrollbar-hide
                     -mx-4 px-4 md:mx-0 md:px-0
                     md:grid md:grid-cols-3 md:overflow-visible
                     scroll-smooth"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollPaddingLeft: '16px',
            scrollPaddingRight: '16px',
          }}
        >
          {BLOG_POSTS.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Mobile scroll indicator dots */}
        <div className="md:hidden flex justify-center gap-2 mt-2">
          {BLOG_POSTS.map((_, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-brand-charcoal/20 transition-colors duration-200"
            />
          ))}
        </div>

        <div className="md:hidden mt-6 text-center">
          <button
            className="ios-footnote uppercase font-bold tracking-widest text-brand-charcoal
                       border-b border-brand-charcoal pb-1
                       active:scale-[0.98] active:opacity-70 transition-all duration-150
                       touch-target"
          >
            Read More News
          </button>
        </div>
      </div>
    </section>
  );
};

export default memo(Blog);
