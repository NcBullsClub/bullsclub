import React, { useState, useRef } from 'react'

const CloudinaryUpload = ({ onUploadSuccess, onUploadError, disabled = false }) => {
  const [image, setImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  // Cloudinary configuration
  const CLOUD_NAME = 'ncbullscloud'
  const UPLOAD_PRESET = 'bulls_app_uploads'

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onUploadError?.('Please select a valid image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onUploadError?.('File size must be less than 5MB')
        return
      }
      setImage(file)
      setProgress(0)
    }
  }

  const uploadImage = async () => {
    if (!image) {
      onUploadError?.('Please select an image first')
      return
    }

    setUploading(true)
    setProgress(10)

    // Prepare the data for Cloudinary
    const formData = new FormData()
    formData.append('file', image)
    formData.append('upload_preset', UPLOAD_PRESET)

    try {
      setProgress(30)
      // Send the POST request to the Cloudinary API
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      setProgress(80)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed')
      }

      // Extract the secure URL and thumb URL to use in your app
      if (data.secure_url) {
        setProgress(100)
        const uploadedData = {
          secure_url: data.secure_url,
          thumb_url: data.secure_url.replace('/upload/', '/upload/w_400,h_400,c_fill/'),
          public_id: data.public_id,
          width: data.width,
          height: data.height,
        }
        
        // Reset form
        setImage(null)
        setProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Callback with uploaded data
        onUploadSuccess?.(uploadedData)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      onUploadError?.(error.message || 'Failed to upload image')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer?.files
    if (files?.[0]) {
      handleImageChange({ target: { files } })
    }
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={uploading || disabled}
          className="hidden"
          aria-label="Upload image file"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="w-full focus:outline-none"
        >
          <div className="text-3xl mb-2">📸</div>
          <p className="font-semibold text-gray-800 mb-1">
            {image ? image.name : 'Drag & drop your image here'}
          </p>
          <p className="text-xs text-gray-500">or click to select a file</p>
          <p className="text-xs text-gray-400 mt-2">Max file size: 5MB (JPG, PNG, WebP)</p>
        </button>
      </div>

      {/* Upload progress */}
      {(uploading || progress > 0) && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Uploading...</span>
            <span className="text-xs font-medium text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload button */}
      {image && !uploading && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={uploadImage}
            className="flex-1 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            disabled={disabled}
          >
            ✓ Upload Image
          </button>
          <button
            onClick={() => {
              setImage(null)
              setProgress(0)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="flex-1 bg-gray-200 text-gray-800 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ✕ Clear
          </button>
        </div>
      )}
    </div>
  )
}

export default CloudinaryUpload
