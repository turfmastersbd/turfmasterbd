import React from 'react'
import Turfs from '@/components/Turfs'
import CompleteProjects from '@/components/CompleteProjects'
import Gallery from '@/components/Gallery'
import ProjectsTurfs from '@/components/ProjectsTurfs'


const Projects = () => {
  return (
    <>
        <section className="projects">
          <div className="container">
            <h2 className='primary-heading projects__heading'>Own Projects</h2>
            <ProjectsTurfs />
            <div className="projects__content">
              <h2 className='primary-heading projects__heading'>Complete Projects</h2>
              <CompleteProjects />
            </div> 
          </div>
          <Gallery /> 
        </section>
    </>
  )
}

export default Projects