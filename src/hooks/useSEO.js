import { useEffect } from 'react';

const useSEO = (title, description) => {
  useEffect(() => {
    // 设置页面标题
    if (title) {
      document.title = title;
    }

    // 设置meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = description;
        document.head.appendChild(metaDescription);
      }
    }

    // 设置Open Graph标题
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (title) {
      if (ogTitle) {
        ogTitle.setAttribute('content', title);
      } else {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        ogTitle.setAttribute('content', title);
        document.head.appendChild(ogTitle);
      }
    }

    // 设置Open Graph描述
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (description) {
      if (ogDescription) {
        ogDescription.setAttribute('content', description);
      } else {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        ogDescription.setAttribute('content', description);
        document.head.appendChild(ogDescription);
      }
    }

    // 设置Twitter标题
    let twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (title) {
      if (twitterTitle) {
        twitterTitle.setAttribute('content', title);
      } else {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('property', 'twitter:title');
        twitterTitle.setAttribute('content', title);
        document.head.appendChild(twitterTitle);
      }
    }

    // 设置Twitter描述
    let twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (description) {
      if (twitterDescription) {
        twitterDescription.setAttribute('content', description);
      } else {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('property', 'twitter:description');
        twitterDescription.setAttribute('content', description);
        document.head.appendChild(twitterDescription);
      }
    }
  }, [title, description]);
};

export default useSEO;
