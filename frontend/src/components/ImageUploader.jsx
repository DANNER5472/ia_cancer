import { useState, useRef } from 'react'
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi'

function ImageUploader({ onImageSelect, selectedImage, onClear }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const validTypes = ['image/jpeg', 'image/png', 'image/dicom', 'application/dicom']
  const maxSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file) => {
    setError('')
    
    // Validar tipo (aceptamos jpg, png y dicom)
    const isValidType = validTypes.includes(file.type) || 
                        file.name.endsWith('.dcm') || 
                        file.name.endsWith('.dicom')
    
    if (!isValidType) {
      setError('Formato no válido. Usa JPG, PNG o DICOM')
      return false
    }

    // Validar tamaño
    if (file.size > maxSize) {
      setError('La imagen es muy grande. Máximo 10MB')
      return false
    }

    return true
  }

  const handleFile = (file) => {
    if (!validateFile(file)) return

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    onImageSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    setPreview(null)
    setError('')
    onClear()
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full">
      {!preview ? (
        // Área de upload
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.dcm,.dicom"
            onChange={handleInputChange}
            className="hidden"
          />
          
          <FiUploadCloud className="mx-auto text-gray-400 mb-4" size={48} />
          
          <p className="text-gray-600 font-medium mb-2">
            Arrastra una imagen aquí o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-400">
            Formatos: JPG, PNG, DICOM • Máximo: 10MB
          </p>
        </div>
      ) : (
        // Preview de imagen
        <div className="relative border rounded-xl overflow-hidden bg-gray-100">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-contain bg-black"
          />
          
          {/* Botón eliminar */}
          <button
            onClick={handleClear}
            className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
          >
            <FiX size={20} />
          </button>

          {/* Info del archivo */}
          <div className="p-4 bg-white border-t flex items-center gap-3">
            <FiImage className="text-blue-500" size={24} />
            <div>
              <p className="font-medium text-gray-800">{selectedImage?.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedImage?.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

export default ImageUploader