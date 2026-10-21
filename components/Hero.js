'use client'

import React, { useRef, useState } from 'react';
import { Navigation, Pagination, Scrollbar, A11y, Autoplay, EffectFade } from 'swiper/modules'

import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import Image from 'next/image'
import SlideOne from '@/public/images/slideone.webp'
import HeroSlideTwo from '@/public/images/slidetwo.webp'
import HeroSlideOne from '@/public/images/slidethree.webp'

const Hero = () => {
  return (
    <>
      <section className='hero'>
        <div className="container">
          <Swiper 
            navigation={true} 
            modules={[Navigation, Pagination, Autoplay]} 
            className="mySwiper"
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }} 
          >
            <SwiperSlide>
              <div className='hero__slider-image-wrap'>
                <Image 
                  src={SlideOne}
                  alt=''
                  width={1500}
                  className='hero__slider-item-image'
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className='hero__slider-image-wrap'>
                <Image 
                  src={HeroSlideOne}
                  alt=''
                  width={1500}
                  className='hero__slider-item-image'
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className='hero__slider-image-wrap'>
                <Image 
                  src={HeroSlideTwo}
                  alt=''
                  width={1500}
                  className='hero__slider-item-image'
                />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>
    </>
  )
}

export default Hero