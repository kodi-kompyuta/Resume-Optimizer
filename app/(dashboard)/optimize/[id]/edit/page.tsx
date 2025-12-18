'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { StructuredResume, ExperienceItem, EducationItem, BulletItem } from '@/types'

export default function EditOptimizedResumePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = params.id as string

  const [resume, setResume] = useState<StructuredResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get optimized resume from sessionStorage (passed from optimize page)
    const savedData = sessionStorage.getItem(`optimized_resume_${resumeId}`)
    if (savedData) {
      const data = JSON.parse(savedData)
      setResume(data.optimizedResume)
      setLoading(false)
    } else {
      setError('No optimized resume data found. Please go back and optimize again.')
      setLoading(false)
    }
  }, [resumeId])

  const handleSaveAndCreate = async () => {
    if (!resume) return

    setSaving(true)
    setError(null)

    try {
      // Get additional data from sessionStorage
      const savedData = sessionStorage.getItem(`optimized_resume_${resumeId}`)
      if (!savedData) {
        throw new Error('Optimization data not found')
      }

      const data = JSON.parse(savedData)

      // Call apply endpoint with edited resume
      const response = await fetch('/api/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          optimizedResume: resume, // Use edited version
          optimizedJson: data.optimizedJson,
          acceptedChanges: data.acceptedChanges,
          createNewVersion: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create version')
      }

      // Clear sessionStorage
      sessionStorage.removeItem(`optimized_resume_${resumeId}`)

      // Redirect to download page
      router.push(`/download/${result.resumeId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (sectionIndex: number, updatedContent: any) => {
    if (!resume) return
    const newResume = { ...resume }
    newResume.sections[sectionIndex].content = updatedContent
    setResume(newResume)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push(`/optimize/${resumeId}`)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back to Optimization
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!resume) return null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Your Optimized Resume</h1>
          <p className="text-gray-600 mt-2">
            Review and edit your optimized resume before creating the final version
          </p>
        </div>

        {/* Edit Sections */}
        <div className="space-y-6">
          {resume.sections.map((section, sectionIndex) => (
            <div key={section.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                {section.heading}
              </h2>

              {/* Different editors based on section type */}
              {section.type === 'contact' && (
                <ContactEditor
                  content={section.content}
                  onChange={(newContent: any) => updateSection(sectionIndex, newContent)}
                />
              )}

              {section.type === 'summary' && (
                <SummaryEditor
                  content={section.content}
                  onChange={(newContent: any) => updateSection(sectionIndex, newContent)}
                />
              )}

              {section.type === 'skills' && (
                <SkillsEditor
                  content={section.content}
                  onChange={(newContent: any) => updateSection(sectionIndex, newContent)}
                />
              )}

              {section.type === 'experience' && (
                <ExperienceEditor
                  content={section.content}
                  onChange={(newContent: any) => updateSection(sectionIndex, newContent)}
                />
              )}

              {section.type === 'education' && (
                <EducationEditor
                  content={section.content}
                  onChange={(newContent: any) => updateSection(sectionIndex, newContent)}
                />
              )}

              {section.type === 'certifications' && (
                <CertificationsEditor
                  content={section.content}
                  onChange={(newContent: any) => updateSection(sectionIndex, newContent)}
                />
              )}

              {section.type === 'references' && (
                <ReferencesEditor
                  content={section.content}
                  onChange={(newContent: any) => updateSection(sectionIndex, newContent)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSaveAndCreate}
            disabled={saving}
            className="flex-1 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {saving ? 'Creating Version...' : 'Save & Create Version'}
          </button>

          <button
            onClick={() => router.push(`/optimize/${resumeId}`)}
            disabled={saving}
            className="px-8 bg-gray-300 text-gray-700 py-4 rounded-lg hover:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Component editors to be implemented below
function ContactEditor({ content, onChange }: any) {
  const contact = content[0]?.content || {}

  const updateField = (field: string, value: string) => {
    const newContent = [{
      ...content[0],
      content: { ...contact, [field]: value }
    }]
    onChange(newContent)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={contact.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={contact.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="text"
          value={contact.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          value={contact.location || ''}
          onChange={(e) => updateField('location', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  )
}

function SummaryEditor({ content, onChange }: any) {
  const text = content[0]?.content || ''

  return (
    <textarea
      value={text}
      onChange={(e) => onChange([{ ...content[0], content: e.target.value }])}
      rows={5}
      className="w-full p-3 border rounded resize-none"
      placeholder="Professional summary..."
    />
  )
}

function SkillsEditor({ content, onChange }: any) {
  const skillsBlock = content[0]
  const skills = skillsBlock?.content?.skills || []

  const updateSkills = (newSkills: string[]) => {
    const newContent = [{
      ...skillsBlock,
      content: { ...skillsBlock.content, skills: newSkills }
    }]
    onChange(newContent)
  }

  const addSkill = () => {
    updateSkills([...skills, ''])
  }

  const removeSkill = (index: number) => {
    updateSkills(skills.filter((_: any, i: number) => i !== index))
  }

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills]
    newSkills[index] = value
    updateSkills(newSkills)
  }

  return (
    <div className="space-y-2">
      {skills.map((skill: string, index: number) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={skill}
            onChange={(e) => updateSkill(index, e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Skill..."
          />
          <button
            onClick={() => removeSkill(index)}
            className="px-3 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        onClick={addSkill}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Add Skill
      </button>
    </div>
  )
}

function ExperienceEditor({ content, onChange }: any) {
  const updateExperience = (index: number, field: string, value: any) => {
    const newContent = [...content]
    newContent[index] = {
      ...newContent[index],
      content: {
        ...newContent[index].content,
        [field]: value
      }
    }
    onChange(newContent)
  }

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const newContent = [...content]
    const achievements = [...(newContent[expIndex].content.achievements || [])]
    achievements[bulletIndex] = { ...achievements[bulletIndex], text: value }
    newContent[expIndex].content.achievements = achievements
    onChange(newContent)
  }

  const addBullet = (expIndex: number) => {
    const newContent = [...content]
    const achievements = [...(newContent[expIndex].content.achievements || [])]
    achievements.push({ id: Date.now().toString(), text: '' })
    newContent[expIndex].content.achievements = achievements
    onChange(newContent)
  }

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newContent = [...content]
    const achievements = [...(newContent[expIndex].content.achievements || [])]
    achievements.splice(bulletIndex, 1)
    newContent[expIndex].content.achievements = achievements
    onChange(newContent)
  }

  return (
    <div className="space-y-6">
      {content.map((block: any, expIndex: number) => {
        if (block.type !== 'experience_item') return null
        const exp = block.content

        return (
          <div key={block.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={exp.jobTitle || ''}
                  onChange={(e) => updateExperience(expIndex, 'jobTitle', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={exp.company || ''}
                  onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(expIndex, 'location', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={exp.startDate || ''}
                    onChange={(e) => updateExperience(expIndex, 'startDate', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Jan 2020"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="text"
                    value={exp.endDate || ''}
                    onChange={(e) => updateExperience(expIndex, 'endDate', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Present"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            {exp.description && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={exp.description || ''}
                  onChange={(e) => updateExperience(expIndex, 'description', e.target.value)}
                  rows={2}
                  className="w-full p-2 border rounded resize-none"
                />
              </div>
            )}

            {/* Achievements/Bullets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Achievements</label>
              <div className="space-y-2">
                {(exp.achievements || []).map((bullet: any, bulletIndex: number) => (
                  <div key={bullet.id} className="flex gap-2">
                    <span className="text-gray-500 mt-2">•</span>
                    <textarea
                      value={bullet.text}
                      onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                      rows={2}
                      className="flex-1 p-2 border rounded resize-none"
                    />
                    <button
                      onClick={() => removeBullet(expIndex, bulletIndex)}
                      className="px-3 bg-red-500 text-white rounded hover:bg-red-600 h-fit"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addBullet(expIndex)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  + Add Achievement
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EducationEditor({ content, onChange }: any) {
  const updateEducation = (index: number, field: string, value: any) => {
    const newContent = [...content]
    newContent[index] = {
      ...newContent[index],
      content: {
        ...newContent[index].content,
        [field]: value
      }
    }
    onChange(newContent)
  }

  return (
    <div className="space-y-4">
      {content.map((block: any, eduIndex: number) => {
        if (block.type !== 'education_item') return null
        const edu = block.content

        return (
          <div key={block.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <input
                  type="text"
                  value={edu.degree || ''}
                  onChange={(e) => updateEducation(eduIndex, 'degree', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  value={edu.institution || ''}
                  onChange={(e) => updateEducation(eduIndex, 'institution', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={edu.location || ''}
                  onChange={(e) => updateEducation(eduIndex, 'location', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Date</label>
                <input
                  type="text"
                  value={edu.graduationDate || ''}
                  onChange={(e) => updateEducation(eduIndex, 'graduationDate', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="June 2020"
                />
              </div>
              {edu.gpa && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                  <input
                    type="text"
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(eduIndex, 'gpa', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CertificationsEditor({ content, onChange }: any) {
  // Certifications can be either bullet_list or text
  const isBulletList = content[0]?.type === 'bullet_list'

  if (isBulletList) {
    const items = content[0]?.content?.items || []

    const updateCertification = (index: number, value: string) => {
      const newItems = [...items]
      newItems[index] = { ...newItems[index], text: value }
      onChange([{
        ...content[0],
        content: { items: newItems }
      }])
    }

    const addCertification = () => {
      const newItems = [...items, { id: Date.now().toString(), text: '' }]
      onChange([{
        ...content[0],
        content: { items: newItems }
      }])
    }

    const removeCertification = (index: number) => {
      const newItems = [...items]
      newItems.splice(index, 1)
      onChange([{
        ...content[0],
        content: { items: newItems }
      }])
    }

    return (
      <div className="space-y-3">
        {items.map((item: any, index: number) => (
          <div key={item.id} className="flex items-start gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateCertification(index, e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Certification name"
              />
            </div>
            <button
              onClick={() => removeCertification(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addCertification}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Certification
        </button>
      </div>
    )
  } else {
    // Text content
    const text = content[0]?.content || ''

    const updateText = (value: string) => {
      onChange([{
        ...content[0],
        content: value
      }])
    }

    return (
      <div>
        <textarea
          value={text}
          onChange={(e) => updateText(e.target.value)}
          className="w-full p-3 border rounded min-h-[100px]"
          placeholder="Enter certifications (one per line or as a paragraph)"
        />
      </div>
    )
  }
}

function ReferencesEditor({ content, onChange }: any) {
  const text = content[0]?.content || 'Available upon request'

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => onChange([{ ...content[0], content: e.target.value }])}
      className="w-full p-2 border rounded"
    />
  )
}
