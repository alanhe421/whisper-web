import React from 'react';

function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 text-center text-gray-500 text-sm bg-white border-t">
      构建时间：{process.env.REACT_APP_BUILD_TIME || '开发环境'}
    </div>
  );
}

export default Footer;
