Pod::Spec.new do |s|
  s.name           = 'BlumaInstagramShare'
  s.version        = '1.0.0'
  s.summary        = 'Lansman görselini Instagram Story ve Gönderi akışına doğrudan açar'
  s.description    = 'instagram-stories:// panosuna bağlantıyı da yazar; Gönderi için görseli Fotoğraflar\'a kaydedip instagram://library açar.'
  s.license        = 'MIT'
  s.author         = 'Bluma'
  s.homepage       = 'https://bluma-dc10e.web.app'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
