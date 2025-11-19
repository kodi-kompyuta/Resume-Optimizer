export async function parseText(buffer: Buffer): Promise<string> {

  try {

    return buffer.toString('utf-8')

  } catch (error) {

    console.error('Text parsing error:', error)

    throw new Error('Failed to parse text file')

  }

}

 