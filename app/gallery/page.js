import React from 'react'
import Image from 'next/image'

import galleryOne from '@/public/images/1.jpg'
import galleryTwo from '@/public/images/2.jpg'
import galleryThree from '@/public/images/3.jpg'
import galleryFour from '@/public/images/4.jpg'
import galleryFive from '@/public/images/5.jpg'
import gallerySix from '@/public/images/6.jpeg'
// import gallerySeven from '@/public/images/7.JPG'
// import galleryEight from '@/public/images/8.jpg'

const Gallery = () => {
  return (
    <>
      <section className='gallery-page'>
        <div className="container">
          <div className="gallery-page__content">
            <h2 className='primary-heading gallery-page__heading'>Gallery</h2>
            <div className='gallery-page__grid'>
              <div className='gallery-page__grid-item'>
                <Image
                  src={galleryOne}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div>
              <div className='gallery-page__grid-item'>
                <Image
                  src={galleryTwo}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div>
              <div className='gallery-page__grid-item'>
                <Image
                  src={galleryThree}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div>
              <div className='gallery-page__grid-item'>
                <Image
                  src={galleryFour}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div>
              <div className='gallery-page__grid-item'>
                <Image
                  src={galleryFive}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div>
              <div className='gallery-page__grid-item'>
                <Image
                  src={gallerySix}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div>
              {/* <div className='gallery-page__grid-item'>
                <Image
                  src={gallerySeven}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div>
              <div className='gallery-page__grid-item'>
                <Image
                  src={galleryEight}
                  alt=''
                  className='gallery-page__image'
                  width={500}
                />
              </div> */}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Gallery