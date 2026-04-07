import Image from 'next/image'

interface ZordLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  className?: string
  variant?: 'light' | 'dark'
}

export function ZordLogo({ size = 'md', className = '', variant = 'dark' }: ZordLogoProps) {
  const sizeConfig = {
    sm: { width: 136, height: 34, containerClassName: 'w-[136px]' },
    md: { width: 176, height: 44, containerClassName: 'w-[176px]' },
    lg: { width: 236, height: 59, containerClassName: 'w-[236px]' },
    hero: { width: 408, height: 102, containerClassName: 'w-[220px] sm:w-[300px] lg:w-[408px]' },
  }

  const currentSize = sizeConfig[size]
  const imageClassName = variant === 'dark' ? 'brightness-0 invert' : ''

  return (
    <div className={`flex items-center ${currentSize.containerClassName} ${className}`}>
      <Image
        src="/sources/logo_company-removebg-preview.png"
        alt="Arealis Zord"
        width={currentSize.width}
        height={currentSize.height}
        className={`${imageClassName} h-auto w-full`}
        priority={size === 'lg' || size === 'hero'}
      />
    </div>
  )
}
