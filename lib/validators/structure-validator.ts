import { StructuredResume, ExperienceItem, EducationItem, ContactInfo } from '@/types'
import { PROTECTED_FIELDS } from '@/lib/schemas/resume-schema'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'critical' | 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
}

/**
 * Validates that resume structure is preserved during optimization
 * Ensures all protected fields remain unchanged
 */
export class ResumeStructureValidator {
  private errors: ValidationError[] = []
  private warnings: ValidationWarning[] = []

  /**
   * Validate that optimized resume preserves original structure
   */
  validateStructurePreservation(
    original: StructuredResume,
    optimized: StructuredResume
  ): ValidationResult {
    this.errors = []
    this.warnings = []

    // Global structure checks
    this.validateGlobalStructure(original, optimized)

    // Section-level checks
    this.validateSections(original, optimized)

    // Metadata checks
    this.validateMetadata(original, optimized)

    return {
      isValid: this.errors.filter(e => e.severity !== 'warning').length === 0,
      errors: this.errors,
      warnings: this.warnings,
    }
  }

  /**
   * Validate global structure
   */
  private validateGlobalStructure(original: StructuredResume, optimized: StructuredResume) {
    // Check section count
    if (original.sections.length !== optimized.sections.length) {
      this.errors.push({
        field: 'sections',
        message: `Section count changed from ${original.sections.length} to ${optimized.sections.length}`,
        severity: 'critical',
      })
    }

    // Check that IDs match
    if (original.id && optimized.id && original.id !== optimized.id) {
      this.errors.push({
        field: 'id',
        message: 'Resume ID changed',
        severity: 'critical',
      })
    }
  }

  /**
   * Validate sections
   */
  private validateSections(original: StructuredResume, optimized: StructuredResume) {
    original.sections.forEach((originalSection, index) => {
      const optimizedSection = optimized.sections[index]

      if (!optimizedSection) {
        this.errors.push({
          field: `sections[${index}]`,
          message: `Section "${originalSection.heading}" is missing`,
          severity: 'critical',
        })
        return
      }

      // Validate section structure
      if (originalSection.id !== optimizedSection.id) {
        this.errors.push({
          field: `sections[${index}].id`,
          message: `Section ID changed from "${originalSection.id}" to "${optimizedSection.id}"`,
          severity: 'critical',
        })
      }

      if (originalSection.type !== optimizedSection.type) {
        this.errors.push({
          field: `sections[${index}].type`,
          message: `Section type changed from "${originalSection.type}" to "${optimizedSection.type}"`,
          severity: 'critical',
        })
      }

      if (originalSection.heading !== optimizedSection.heading) {
        this.errors.push({
          field: `sections[${index}].heading`,
          message: `Section heading changed from "${originalSection.heading}" to "${optimizedSection.heading}"`,
          severity: 'error',
        })
      }

      if (originalSection.order !== optimizedSection.order) {
        this.errors.push({
          field: `sections[${index}].order`,
          message: `Section order changed from ${originalSection.order} to ${optimizedSection.order}`,
          severity: 'error',
        })
      }

      // Validate content blocks
      this.validateContentBlocks(originalSection, optimizedSection, index)
    })
  }

  /**
   * Validate content blocks within sections
   */
  private validateContentBlocks(
    originalSection: any,
    optimizedSection: any,
    sectionIndex: number
  ) {
    if (originalSection.content.length !== optimizedSection.content.length) {
      this.errors.push({
        field: `sections[${sectionIndex}].content`,
        message: `Content block count changed from ${originalSection.content.length} to ${optimizedSection.content.length}`,
        severity: 'critical',
      })
      return
    }

    originalSection.content.forEach((originalBlock: any, blockIndex: number) => {
      const optimizedBlock = optimizedSection.content[blockIndex]

      if (!optimizedBlock) return

      // Check block ID
      if (originalBlock.id !== optimizedBlock.id) {
        this.errors.push({
          field: `sections[${sectionIndex}].content[${blockIndex}].id`,
          message: `Content block ID changed`,
          severity: 'critical',
        })
      }

      // Check block type
      if (originalBlock.type !== optimizedBlock.type) {
        this.errors.push({
          field: `sections[${sectionIndex}].content[${blockIndex}].type`,
          message: `Content block type changed from "${originalBlock.type}" to "${optimizedBlock.type}"`,
          severity: 'critical',
        })
      }

      // Type-specific validation
      switch (originalBlock.type) {
        case 'experience_item':
          this.validateExperienceItem(
            originalBlock.content,
            optimizedBlock.content,
            sectionIndex,
            blockIndex
          )
          break
        case 'education_item':
          this.validateEducationItem(
            originalBlock.content,
            optimizedBlock.content,
            sectionIndex,
            blockIndex
          )
          break
        case 'contact_info':
          this.validateContactInfo(
            originalBlock.content,
            optimizedBlock.content,
            sectionIndex,
            blockIndex
          )
          break
        case 'bullet_list':
          this.validateBulletList(
            originalBlock.content,
            optimizedBlock.content,
            sectionIndex,
            blockIndex
          )
          break
      }
    })
  }

  /**
   * Validate experience item
   */
  private validateExperienceItem(
    original: ExperienceItem,
    optimized: ExperienceItem,
    sectionIndex: number,
    blockIndex: number
  ) {
    const path = `sections[${sectionIndex}].content[${blockIndex}]`

    // CRITICAL: These fields must NEVER change
    if (original.id !== optimized.id) {
      this.errors.push({
        field: `${path}.id`,
        message: 'Experience item ID changed',
        severity: 'critical',
      })
    }

    if (original.jobTitle !== optimized.jobTitle) {
      this.errors.push({
        field: `${path}.jobTitle`,
        message: `Job title changed from "${original.jobTitle}" to "${optimized.jobTitle}"`,
        severity: 'critical',
      })
    }

    if (original.company !== optimized.company) {
      this.errors.push({
        field: `${path}.company`,
        message: `Company changed from "${original.company}" to "${optimized.company}"`,
        severity: 'critical',
      })
    }

    if (original.location !== optimized.location) {
      this.errors.push({
        field: `${path}.location`,
        message: `Location changed from "${original.location}" to "${optimized.location}"`,
        severity: 'critical',
      })
    }

    if (original.startDate !== optimized.startDate) {
      this.errors.push({
        field: `${path}.startDate`,
        message: `Start date changed from "${original.startDate}" to "${optimized.startDate}"`,
        severity: 'critical',
      })
    }

    if (original.endDate !== optimized.endDate) {
      this.errors.push({
        field: `${path}.endDate`,
        message: `End date changed from "${original.endDate}" to "${optimized.endDate}"`,
        severity: 'critical',
      })
    }

    if (original.description !== optimized.description) {
      this.errors.push({
        field: `${path}.description`,
        message: `Position description changed`,
        severity: 'critical',
      })
    }

    // Check achievements count
    if (original.achievements.length !== optimized.achievements.length) {
      this.errors.push({
        field: `${path}.achievements`,
        message: `Achievement count changed from ${original.achievements.length} to ${optimized.achievements.length}`,
        severity: 'critical',
      })
    }

    // Check achievement IDs are preserved
    original.achievements.forEach((originalAchievement, index) => {
      const optimizedAchievement = optimized.achievements[index]
      if (optimizedAchievement && originalAchievement.id !== optimizedAchievement.id) {
        this.errors.push({
          field: `${path}.achievements[${index}].id`,
          message: 'Achievement ID changed',
          severity: 'critical',
        })
      }
    })
  }

  /**
   * Validate education item
   */
  private validateEducationItem(
    original: EducationItem,
    optimized: EducationItem,
    sectionIndex: number,
    blockIndex: number
  ) {
    const path = `sections[${sectionIndex}].content[${blockIndex}]`

    // CRITICAL: These fields must NEVER change
    if (original.id !== optimized.id) {
      this.errors.push({
        field: `${path}.id`,
        message: 'Education item ID changed',
        severity: 'critical',
      })
    }

    if (original.degree !== optimized.degree) {
      this.errors.push({
        field: `${path}.degree`,
        message: `Degree changed from "${original.degree}" to "${optimized.degree}"`,
        severity: 'critical',
      })
    }

    if (original.institution !== optimized.institution) {
      this.errors.push({
        field: `${path}.institution`,
        message: `Institution changed from "${original.institution}" to "${optimized.institution}"`,
        severity: 'critical',
      })
    }

    if (original.location !== optimized.location) {
      this.errors.push({
        field: `${path}.location`,
        message: `Location changed`,
        severity: 'critical',
      })
    }

    if (original.graduationDate !== optimized.graduationDate) {
      this.errors.push({
        field: `${path}.graduationDate`,
        message: `Graduation date changed`,
        severity: 'critical',
      })
    }

    if (original.gpa !== optimized.gpa) {
      this.errors.push({
        field: `${path}.gpa`,
        message: `GPA changed`,
        severity: 'critical',
      })
    }
  }

  /**
   * Validate contact information
   */
  private validateContactInfo(
    original: ContactInfo,
    optimized: ContactInfo,
    sectionIndex: number,
    blockIndex: number
  ) {
    const path = `sections[${sectionIndex}].content[${blockIndex}]`

    // All contact fields must be preserved
    const contactFields = ['name', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio', 'website']

    contactFields.forEach(field => {
      const originalValue = (original as any)[field]
      const optimizedValue = (optimized as any)[field]

      if (originalValue !== optimizedValue) {
        this.errors.push({
          field: `${path}.${field}`,
          message: `Contact ${field} changed from "${originalValue}" to "${optimizedValue}"`,
          severity: 'critical',
        })
      }
    })
  }

  /**
   * Validate bullet list
   */
  private validateBulletList(
    original: any,
    optimized: any,
    sectionIndex: number,
    blockIndex: number
  ) {
    const path = `sections[${sectionIndex}].content[${blockIndex}]`

    if (original.items.length !== optimized.items.length) {
      this.errors.push({
        field: `${path}.items`,
        message: `Bullet count changed from ${original.items.length} to ${optimized.items.length}`,
        severity: 'critical',
      })
    }

    // Check bullet IDs preserved
    original.items.forEach((originalItem: any, index: number) => {
      const optimizedItem = optimized.items[index]
      if (optimizedItem && originalItem.id !== optimizedItem.id) {
        this.errors.push({
          field: `${path}.items[${index}].id`,
          message: 'Bullet ID changed',
          severity: 'critical',
        })
      }
    })
  }

  /**
   * Validate metadata
   */
  private validateMetadata(original: StructuredResume, optimized: StructuredResume) {
    // Metadata should be mostly preserved
    if (original.metadata.originalFilename !== optimized.metadata.originalFilename) {
      this.warnings.push({
        field: 'metadata.originalFilename',
        message: 'Original filename changed',
      })
    }

    if (original.metadata.fileType !== optimized.metadata.fileType) {
      this.warnings.push({
        field: 'metadata.fileType',
        message: 'File type changed',
      })
    }
  }
}

/**
 * Convenience function to validate structure preservation
 */
export function validateStructurePreservation(
  original: StructuredResume,
  optimized: StructuredResume
): ValidationResult {
  const validator = new ResumeStructureValidator()
  return validator.validateStructurePreservation(original, optimized)
}
