'use client'

import React, { useRef, useState } from 'react';
import { Navigation, Pagination, Scrollbar, A11y, Autoplay, EffectFade, FreeMode } from 'swiper/modules'

import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import Link from 'next/link';
import Image from 'next/image'
import sliderOne from '@/public/images/1.jpg'
import sliderTwo from '@/public/images/2.jpg'
import sliderThree from '@/public/images/3.jpg'
import sliderFour from '@/public/images/4.jpg'
import sliderFive from '@/public/images/5.jpg'
import sliderSix from '@/public/images/6.jpeg'
// import sliderSeven from '@/public/images/7.JPG'
// import sliderEight from '@/public/images/8.jpg'

const Gallery = () => {
  return (
    <>
      <section className='gallery'>
        <h2 className='primary-heading gallery__heading'>Gallery</h2>
            <div className='gallery__content'>
                <Swiper  
                    modules={[Navigation, Pagination, Autoplay, FreeMode]} 
                    className="mySwiper2"
                    loop={true}
                    freeMode={true}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                    }}
                    breakpoints={{
                        340: {
                            slidesPerView: 2,
                            spaceBetween: 10,
                        },
                        1024: {
                            slidesPerView: 4,
                            spaceBetween: 10,
                        }
                    }}
                    >

                    <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderOne}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderTwo}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderThree}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderFour}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderFive}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderSix}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide>
                    {/* <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderSeven}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div className='gallery__slider-image-wrap'>
                            <Image 
                                src={sliderEight}
                                alt=''
                                width={500}
                                className='gallery__slider-item-image'
                                loading='lazy'
                            />
                        </div>
                    </SwiperSlide> */}
                </Swiper>
            </div>
            <div className='gallery__button-wrap'>
                <Link href='/gallery'>
                    <span className='secondary-button'>View More</span>
                </Link>
            </div>
      </section>
    </>
  )
}

export default Gallery