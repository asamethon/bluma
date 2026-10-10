import {
  captureCommentImage,
  pickCommentImage,
  pickContentImage,
  pickImageFromGallery,
  takePhotoWithCamera,
} from './image/picker';
import { uploadImage } from './image/upload';

export const imageUploadService = {
  uploadProfileImage: (uri: string) => uploadImage(uri, 'profile', 'imageUpload.profileError'),
  uploadProfileCover: (uri: string) => uploadImage(uri, 'cover', 'account.profileUpdateFailed'),
  uploadBookCover: (uri: string) => uploadImage(uri, 'cover', 'imageUpload.coverError'),
  uploadCommentImage: (uri: string) => uploadImage(uri, 'comment', 'imageUpload.commentError'),
  uploadStoryContentImage: (uri: string) => uploadImage(uri, 'content', 'imageUpload.contentError'),
  pickImageFromGallery,
  takePhotoWithCamera,
  pickCommentImage,
  captureCommentImage,
  pickContentImage,
};
