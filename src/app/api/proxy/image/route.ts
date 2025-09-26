import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Validate that it's a Google image URL for security
    if (!imageUrl.startsWith('https://lh3.googleusercontent.com/')) {
      return NextResponse.json({ error: 'Only Google image URLs are allowed' }, { status: 400 })
    }

    // Fetch the image from Google
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TaskManagementApp/1.0)',
      },
    })

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: imageResponse.status })
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}