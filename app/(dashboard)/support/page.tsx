import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Mail,
  Phone,
  MessageSquare,
  HelpCircle,
  MapPin,
  Clock,
  Globe,
  Star,
  Share2,
  Heart,
  Building2,
} from "lucide-react"

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get help and support for using the SACCO management system.
        </p>
      </div>

      {/* Company Information Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Binary Labs Solutions</CardTitle>
                <CardDescription>
                  Technology Park, Mpererwe, Kampala, Uganda
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Heart className="mr-1 h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-1 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            At Binary Labs Solutions, we think technology should make businesses
            stronger not more complicated. We're a group of enthusiastic tech
            professionals dedicated to assisting companies in realizing their
            full potential through innovative, dependable, and secure digital
            solutions. Whether you want to enhance your cybersecurity, create an
            engaging web presence, or streamline your data systems, we're here
            to make it possible.
          </p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Be the first to review</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              Open 24 hours
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Get in touch with Binary Labs Solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">0707 265240</p>
                <p className="text-xs text-muted-foreground">Available 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">binarylabs01@gmail.com</p>
                <p className="text-xs text-muted-foreground">Email support</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Technology Park</p>
                <p className="text-xs text-muted-foreground">
                  Mpererwe, Kampala, Uganda
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Website</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1">
                <Phone className="mr-2 h-4 w-4" />
                Call Now
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SACCO System Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              SACCO System Support
            </CardTitle>
            <CardDescription>
              Help with your SACCO management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  How do I add a new member?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Go to Members → Add Member and fill in the required details
                  including personal information and contact details.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  How do I process a loan application?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to Loans → New Loan and complete the application form
                  with member details and loan terms.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  How do I manage savings accounts?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Use the Savings section to create accounts, process deposits,
                  withdrawals, and track member savings.
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Complete Documentation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Our Services</CardTitle>
          <CardDescription>
            Technology solutions we provide to enhance your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Web Development</h4>
              <p className="text-sm text-muted-foreground">
                Custom websites and web applications
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Cybersecurity</h4>
              <p className="text-sm text-muted-foreground">
                Protect your digital assets and data
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Data Systems</h4>
              <p className="text-sm text-muted-foreground">
                Streamline and optimize your data management
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
