import React from 'react'
import Image from 'next/image'

import SkyTurf from '@/public/images/turfimage.webp'
import TimeUpTurf from '@/public/images/timeupturf.webp'

const CompleteProjects = () => {
    return (
        <>
            <div className='projects__cards'>
                <div className="projects__card">
                    <div className="projects__card-image-wrap">
                        <Image
                            src={SkyTurf}
                            alt=''
                            className='projects__card-image'
                            width={600}
                        />
                    </div>
                    <div className="projects__card-content-wrap">
                        <h3 className='projects__card-heading'>Royel Turf & Swimming Zone</h3>
                        <p className='projects__card-text'>Royel Turf & Swimming Zone is a rooftop artificial turf located on Sonir Akhra Main Road. It is a commercial project fully owned and operated by Royel Turf & Swimming Zone. The field is built on a rooftop, giving it a unique and attractive environment compared to regular ground turfs. Its setup and design create a different playing experience that draws attention from players.
                            Since launching, Royel Turf & Swimming Zone has served over 25,000+ players, showing strong demand and popularity. This project highlights Royel Turf & Swimming Zone ability not only to build turf fields but also to successfully run and manage them as a business.</p>
                        <p className='projects__card-location'>Shonir Akhra</p>
                    </div>
                </div>



                <div className="projects__card">
                    <div className="projects__card-image-wrap">
                        <Image
                            src={TimeUpTurf}
                            alt=''
                            className='projects__card-image'
                            width={600}
                        />
                    </div>
                    <div className="projects__card-content-wrap">
                        <h3 className='projects__card-heading'>Bandarban (UNO Project)</h3>
                        <p className='projects__card-text'>The Bandarban Officers Club turf was successfully constructed by Royel Turf & Swimming Zone and officially inaugurated on December 27. This project was developed under the Bandarban DC Office, which owns and manages the facility.
                            Royel Turf & Swimming Zone handled the complete construction process, from ground preparation to final finishing, ensuring high-quality delivery. The project received strong appreciation from the DC Sir and ADC Sir for its quality and execution.
                            This project highlights Royel Turf & Swimming Zone’s capability to deliver reliable and professional turf solutions for government institutions, meeting both technical standards and client expectations.</p>
                        <p className='projects__card-location'>Bandarban (UNO Project)</p>
                    </div>
                </div>

                <div className="projects__card">
                    <div className="projects__card-image-wrap">
                        <Image
                            src={TimeUpTurf}
                            alt=''
                            className='projects__card-image'
                            width={600}
                        />
                    </div>
                    <div className="projects__card-content-wrap">
                        <h3 className='projects__card-heading'>The Alikadam turf</h3>
                        <p className='projects__card-text'>The Alikadam turf project was developed for the UNO Office as an indoor 5-a-side facility. Completed and inaugurated in February, this project was fully constructed by Royel Turf & Swimming Zone.
                            The client expressed strong satisfaction with the quality and overall execution. This project reflects Royel Turf & Swimming Zone’s ability to deliver efficient and well-designed indoor turf solutions for government institutions.</p>
                        <p className='projects__card-location'>Alikadam</p>
                    </div>
                </div>

                <div className="projects__card">
                    <div className="projects__card-image-wrap">
                        <Image
                            src={TimeUpTurf}
                            alt=''
                            className='projects__card-image'
                            width={600}
                        />
                    </div>
                    <div className="projects__card-content-wrap">
                        <h3 className='projects__card-heading'>Feni turf</h3>
                        <p className='projects__card-text'>The Feni (Chhagalnaiya) turf project is a commercial 5-a-side field developed by Royel Turf & Swimming Zone. Located near the town area, it offers easy access for regular players. For this project, premium 47mm artificial grass was used to ensure better durability and playing experience.
                            This project reflects Royel Turf & Swimming Zone’s capability to deliver high-quality commercial turf solutions tailored for business use and long-term performance.</p>
                        <p className='projects__card-location'>Feni</p>
                    </div>
                </div>

                <div className="projects__card">
                    <div className="projects__card-image-wrap">
                        <Image
                            src={TimeUpTurf}
                            alt=''
                            className='projects__card-image'
                            width={600}
                        />
                    </div>
                    <div className="projects__card-content-wrap">
                        <h3 className='projects__card-heading'>Sattar Market turf</h3>
                        <p className='projects__card-text'>The Alikadam turf project was developed for the UNO Office as an indoor 5-a-side facility. Completed and inaugurated in February, this project was fully constructed by Royel Turf & Swimming Zone.
                            The client expressed strong satisfaction with the quality and overall execution. This project reflects Royel Turf & Swimming Zone’s ability to deliver efficient and well-designed indoor turf solutions for government institutions.</p>
                        <p className='projects__card-location'>Sattar Market</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CompleteProjects