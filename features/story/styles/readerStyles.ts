import { readerBodyStyles } from './reader/body';
import { readerChromeStyles } from './reader/chrome';
import { readerGateStyles } from './reader/gate';

/** Okuyucu ekranının tüm stilleri; parçalar alanlarına göre ayrı dosyalarda. */
export const readerStyles = {
  ...readerChromeStyles,
  ...readerBodyStyles,
  ...readerGateStyles,
};
