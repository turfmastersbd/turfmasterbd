import React from 'react'
import Image from 'next/image'

import SkyTurf from '@/public/images/turfimage.webp'

const ProjectsTurfs = () => {
    return (
        <>
            <div className="projects__turfs">
                <div className="projects__turf">
                    <div className="projects__turf-image-wrap">
                        <Image
                            src={SkyTurf}
                            alt=''
                            width={500}
                            className='projects__turf-image'
                        />
                    </div>
                    <div className="projects__turf-content-wrap">
                        <h3 className='projects__turf-heading'>Royel Turf & Swimming Zone</h3>
                        <p className='projects__turf-location'>Shonir Akhra</p>
                        <p className='projects__turf-type'>Rooftop Turf</p>
                        <p className='projects__turf-est'>2023</p>
                        <p className='projects__turf-tag'>Owned & Operated by Royel Turf & Swimming Zone</p>
                    </div>
                </div>

            </div>
        </>
    )
}

export default ProjectsTurfs