import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        //console.log(">>>>>token",token);
        const { pathname } = req.nextUrl;
        
        // Allow access to auth pages
        if (pathname.startsWith('/auth')) {
          return true;
        }
        
        // Require authentication for protected routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
          return !!token;
        }
        
        // Admin-only routes
        if (pathname.startsWith('/admin')) {
          return token?.role === 'admin';
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*']
};
